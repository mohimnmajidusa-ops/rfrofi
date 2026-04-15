'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChatMessage } from './chat-message'
import { ThemeToggle } from './theme-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Settings, Send, Trash2, ArrowLeft, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const STORAGE_KEY = 'deepseek_api_key'
const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface HistoryMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const QUICK_PROMPTS = [
  "What can I cook with what I have?",
  "Which items are expiring soon?",
  "Suggest a healthy meal plan for today",
  "Give me a quick recipe idea",
]

export function AiChatView() {
  const [apiKey, setApiKey] = useState<string>('')
  const [apiKeyInput, setApiKeyInput] = useState<string>('')
  const [showKey, setShowKey] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: history, isLoading: historyLoading } = useSWR<HistoryMessage[]>(
    '/api/ai/history',
    fetcher
  )

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setApiKey(stored)
      setApiKeyInput(stored)
    }
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingMessage])

  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim()
    if (!trimmed) {
      toast.error('Please enter an API key')
      return
    }
    localStorage.setItem(STORAGE_KEY, trimmed)
    setApiKey(trimmed)
    setSettingsOpen(false)
    toast.success('API key saved')
  }

  const removeApiKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey('')
    setApiKeyInput('')
    toast.success('API key removed')
  }

  const handleSend = useCallback(async (messageOverride?: string) => {
    const text = (messageOverride ?? input).trim()
    if (!text || isLoading) return

    if (!apiKey) {
      toast.error('Please add your DeepSeek API key in Settings first')
      setSettingsOpen(true)
      return
    }

    setInput('')
    setIsLoading(true)
    setStreamingMessage('...')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, apiKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong')
        setStreamingMessage(null)
        return
      }

      setStreamingMessage(null)
      await globalMutate('/api/ai/history')
    } catch {
      toast.error('Failed to reach the server')
      setStreamingMessage(null)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, apiKey])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = async () => {
    try {
      await fetch('/api/ai/history', { method: 'DELETE' })
      await globalMutate('/api/ai/history')
      toast.success('Chat history cleared')
    } catch {
      toast.error('Failed to clear history')
    } finally {
      setClearConfirmOpen(false)
    }
  }

  const hasApiKey = !!apiKey
  const hasMessages = (history?.length ?? 0) > 0

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to inventory">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-tight text-foreground">
              AI Chef
            </h1>
            <p className="text-xs text-muted-foreground">Powered by DeepSeek</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasMessages && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setClearConfirmOpen(true)}
              aria-label="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader className="pb-4">
                <SheetTitle>DeepSeek Settings</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="api-key">DeepSeek API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowKey((v) => !v)}
                    >
                      {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your key is stored locally on this device only and never sent to our servers.
                    Get yours at{' '}
                    <a
                      href="https://platform.deepseek.com/api_keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      platform.deepseek.com
                    </a>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={saveApiKey}>
                    Save Key
                  </Button>
                  {hasApiKey && (
                    <Button variant="outline" onClick={removeApiKey} className="text-destructive hover:text-destructive">
                      Remove
                    </Button>
                  )}
                </div>

                {hasApiKey && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">API key is configured</span>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <ThemeToggle />
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-4">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              {/* Animated chef hat SVG */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulse ring */}
                <span className="absolute h-24 w-24 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                <span className="absolute h-20 w-20 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                {/* Chef hat icon */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    {/* hat brim */}
                    <rect x="14" y="44" width="36" height="7" rx="3" fill="currentColor" opacity="0.9"/>
                    {/* hat body */}
                    <path d="M20 44 C20 44 16 38 16 30 C16 22 22 17 28 17 C28 17 26 12 32 12 C38 12 36 17 36 17 C42 17 48 22 48 30 C48 38 44 44 44 44 Z" fill="currentColor" opacity="0.85"/>
                    {/* steam wisps */}
                    <path d="M26 9 C26 9 24 7 26 5 C28 3 26 1 26 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" className="origin-bottom">
                      <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.6s" repeatCount="indefinite" />
                    </path>
                    <path d="M32 8 C32 8 30 6 32 4 C34 2 32 0 32 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5">
                      <animateTransform attributeName="transform" type="translate" values="0,0; 0,-4; 0,0" dur="1.6s" begin="0.3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.6s" begin="0.3s" repeatCount="indefinite" />
                    </path>
                    <path d="M38 9 C38 9 36 7 38 5 C40 3 38 1 38 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5">
                      <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="1.6s" begin="0.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.6s" begin="0.6s" repeatCount="indefinite" />
                    </path>
                  </svg>
                </div>
              </div>
              {/* Text */}
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">AI Chef is warming up</p>
                <p className="text-xs text-muted-foreground">Loading your kitchen...</p>
              </div>
              {/* Animated dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : !hasMessages && !streamingMessage ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M15 11h.01M11 11h.01M7 11h.01M3 8l1 9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-9H3z"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground">AI Chef</h2>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground leading-relaxed">
                Ask me what to cook based on your inventory, and I&apos;ll suggest meals, recipes, and diet plans.
              </p>

              {!hasApiKey && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Add your DeepSeek API key to get started</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )}

              {hasApiKey && (
                <div className="mt-6 w-full max-w-sm space-y-2">
                  <p className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Try asking
                  </p>
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted active:scale-[0.99]"
                    >
                      <span>{prompt}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {history?.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {streamingMessage && streamingMessage !== '...' && (
                <ChatMessage role="assistant" content={streamingMessage} isStreaming />
              )}
              {streamingMessage === '...' && (
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Quick prompts row (when there are messages already) */}
      {hasMessages && hasApiKey && (
        <div className="shrink-0 overflow-x-auto border-t border-border bg-background/80 px-4 py-2 backdrop-blur-sm">
          <div className="flex gap-2 pb-0.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="shrink-0 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 border-t border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasApiKey ? 'Ask about your inventory...' : 'Add your API key in Settings to start'}
            disabled={isLoading || !hasApiKey}
            rows={1}
            className="max-h-32 min-h-10 resize-none py-2.5 text-sm leading-relaxed"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || !hasApiKey}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mx-auto mt-1.5 max-w-lg text-center text-xs text-muted-foreground/60">
          Press Enter to send &middot; Shift+Enter for new line
        </p>
      </div>

      {/* Clear history confirmation */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages from your chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
