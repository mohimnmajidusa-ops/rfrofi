'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ItemTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Package, Search, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TemplateGalleryProps {
  onSelect: (template: ItemTemplate) => void
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const { data: templates, isLoading, mutate } = useSWR<ItemTemplate[]>(
    '/api/templates',
    fetcher
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      mutate()
    } catch {
      toast.error('Failed to remove template')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-20 flex-shrink-0 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return null
  }

  const filtered = search.trim()
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : templates

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
          Quick select from templates
        </p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-6 w-32 rounded-md border border-input bg-background pl-6 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No templates match &quot;{search}&quot;</p>
        )}
        {filtered.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={cn(
              'group relative flex-shrink-0 flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all',
              'border-2 border-transparent hover:border-primary/40 hover:bg-accent focus:outline-none focus:border-primary'
            )}
          >
            {/* Delete button */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute -right-1.5 -top-1.5 z-10 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              onClick={(e) => handleDelete(e, template.id)}
              disabled={deletingId === template.id}
            >
              <X className="h-3 w-3" />
            </Button>

            {/* Image */}
            <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-muted flex-shrink-0">
              {template.image_url ? (
                <Image
                  src={template.image_url}
                  alt={template.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Name */}
            <span className="w-16 text-center text-xs text-foreground leading-tight line-clamp-2">
              {template.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
