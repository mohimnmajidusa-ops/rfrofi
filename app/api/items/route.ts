import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const sort = searchParams.get('sort') || 'created'
  const direction = searchParams.get('direction') || 'desc'
  const search = searchParams.get('search')

  const supabase = await createClient()

  let query = supabase.from('items').select('*')

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  // Handle sorting
  const sortColumn = sort === 'expiration' ? 'expiration_date' : 
                     sort === 'created' ? 'created_at' : sort
  query = query.order(sortColumn, { ascending: direction === 'asc', nullsFirst: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
