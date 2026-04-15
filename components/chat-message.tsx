'use client'

import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

// Detect a markdown table row: | col | col |
function isTableRow(line: string) {
  return line.trim().startsWith('|') && line.trim().endsWith('|')
}

// Parse a markdown table row into cells
function parseTableRow(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)           // strip leading/trailing |
    .split('|')
    .map((cell) => cell.trim())
}

// Check if a row is a separator (|---|---|)
function isSeparatorRow(cells: string[]) {
  return cells.every((c) => /^:?-+:?$/.test(c))
}

function renderTable(headers: string[], rows: string[][], key: string) {
  return (
    <div key={key} className="my-3 w-full">
      {/* Desktop: scrollable table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                >
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  ri % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-sm text-foreground">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="rounded-xl border border-border bg-card px-4 py-3 space-y-2"
          >
            {headers.map((header, ci) => (
              <div key={ci} className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
                  {header}
                </span>
                <span className="text-sm text-foreground text-right">
                  {renderInline(row[ci] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Markdown table detection
    if (isTableRow(line)) {
      const tableLines: string[] = []
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i])
        i++
      }

      const parsed = tableLines.map(parseTableRow)
      // Filter out separator rows
      const [headerRow, ...rest] = parsed
      const dataRows = rest.filter((r) => !isSeparatorRow(r))

      if (headerRow && dataRows.length > 0) {
        elements.push(renderTable(headerRow, dataRows, `table-${i}`))
      }
      continue
    }

    // Heading (### or ##)
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="mt-3 mb-1 text-sm font-semibold text-foreground">
          {renderInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="mt-4 mb-1 text-base font-bold text-foreground">
          {renderInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }

    // Bullet list
    if (line.match(/^[-*•]\s/)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^[-*•]\s/)) {
        listItems.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1 pl-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const listItems: { num: string; text: string }[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        const match = lines[i].match(/^(\d+)\.\s(.*)/)
        if (match) listItems.push({ num: match[1], text: match[2] })
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 space-y-1.5 pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {item.num}
              </span>
              <span>{renderInline(item.text)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Divider
    if (line.match(/^---+$/)) {
      elements.push(<hr key={i} className="my-3 border-border/50" />)
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return elements
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    // Handle *italic*
    const italicParts = part.split(/(\*[^*]+\*)/g)
    return italicParts.map((p, j) => {
      if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
        return <em key={`${i}-${j}`} className="italic">{p.slice(1, -1)}</em>
      }
      return p
    })
  })
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-card border border-border text-card-foreground'
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="space-y-1">
            {formatContent(content)}
            {isStreaming && (
              <span className="inline-flex items-center gap-1 pt-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
