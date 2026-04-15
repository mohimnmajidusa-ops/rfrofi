'use server'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { message, apiKey } = body

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'DeepSeek API key is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch all inventory items to build context
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('name, category, quantity, weight, weight_unit, expiration_date')
    .order('expiration_date', { ascending: true, nullsFirst: false })

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }

  // Fetch recent chat history (last 10 messages) for context
  const { data: history } = await supabase
    .from('ai_chat_history')
    .select('role, content')
    .order('created_at', { ascending: false })
    .limit(10)

  const recentHistory = (history ?? []).reverse()

  // Build inventory context string
  const inventoryText = items && items.length > 0
    ? items.map((item) => {
        const parts = [`${item.name} (${item.category}, qty: ${item.quantity}`]
        if (item.weight) parts[0] += `, ${item.weight}${item.weight_unit}`
        if (item.expiration_date) {
          const exp = new Date(item.expiration_date)
          const today = new Date()
          const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          parts[0] += `, expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
        }
        parts[0] += ')'
        return parts[0]
      }).join('\n')
    : 'The inventory is currently empty.'

  const systemPrompt = `You are a helpful culinary assistant and nutritionist. You have access to the user's current food inventory listed below. Based on what they have, you suggest creative meals, recipes, and diet plans.

CURRENT INVENTORY:
${inventoryText}

GUIDELINES:
- Prioritize ingredients that are expiring soon
- Suggest complete meals with step-by-step recipe outlines
- Include nutritional insights when relevant
- Be creative but practical — only use ingredients they actually have
- Format your responses clearly with headers (using **bold**), bullet points, and sections
- If the inventory is empty, kindly ask the user to add some items first
- Keep responses concise but informative`

  const messages = [
    ...recentHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ]

  // Save user message to history
  await supabase.from('ai_chat_history').insert({ role: 'user', content: message })

  // Call DeepSeek API
  let assistantMessage = ''
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const msg = (err as { error?: { message?: string } })?.error?.message || `DeepSeek error: ${response.status}`
      // Remove the user message we just inserted since we failed
      await supabase
        .from('ai_chat_history')
        .delete()
        .eq('role', 'user')
        .eq('content', message)
      return NextResponse.json({ error: msg }, { status: response.status })
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    assistantMessage = data.choices?.[0]?.message?.content ?? ''
  } catch {
    return NextResponse.json({ error: 'Failed to reach DeepSeek API. Check your API key and try again.' }, { status: 502 })
  }

  // Save assistant message to history
  await supabase.from('ai_chat_history').insert({ role: 'assistant', content: assistantMessage })

  return NextResponse.json({ message: assistantMessage })
}
