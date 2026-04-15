'use client'

import { Item } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Package } from 'lucide-react'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import Image from 'next/image'

export type ViewMode = 'list' | 'grid'

interface ItemCardProps {
  item: Item
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  view?: ViewMode
}

function getExpirationStatus(expirationDate: string | null) {
  if (!expirationDate) return { label: 'No expiry', variant: 'secondary' as const, urgency: 0 }
  
  const expDate = new Date(expirationDate)
  const daysUntil = differenceInDays(expDate, new Date())
  
  if (isPast(expDate) && !isToday(expDate)) {
    return { label: 'Expired', variant: 'destructive' as const, urgency: 3 }
  }
  if (isToday(expDate)) {
    return { label: 'Expires today', variant: 'destructive' as const, urgency: 3 }
  }
  if (daysUntil <= 3) {
    return { label: `${daysUntil}d left`, variant: 'destructive' as const, urgency: 2 }
  }
  if (daysUntil <= 7) {
    return { label: `${daysUntil}d left`, variant: 'default' as const, urgency: 1 }
  }
  return { label: format(expDate, 'MMM d'), variant: 'secondary' as const, urgency: 0 }
}

const categoryColors: Record<string, string> = {
  Fruits: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Vegetables: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Dairy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Meat: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Seafood: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  Bakery: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Frozen: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  Beverages: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Snacks: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  Condiments: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Canned Goods': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  Grains: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

export function ItemCard({ item, onEdit, onDelete, view = 'list' }: ItemCardProps) {
  const expStatus = getExpirationStatus(item.expiration_date)

  if (view === 'grid') {
    return (
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
            {/* Expiry badge overlay */}
            <div className="absolute left-2 top-2">
              <Badge variant={expStatus.variant} className="text-xs shadow-sm">
                {expStatus.label}
              </Badge>
            </div>
          </div>

          {/* Info + actions */}
          <div className="p-3">
            <h3 className="truncate font-semibold text-sm leading-tight text-foreground">
              {item.name}
            </h3>
            <div className="mt-1 flex items-center justify-between gap-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate ${categoryColors[item.category] || categoryColors.Other}`}>
                {item.category}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">×{item.quantity}</span>
            </div>
            {/* Action row — always visible */}
            <div className="mt-2 flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 gap-1 text-xs"
                onClick={(e) => { e.stopPropagation(); onEdit(item) }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 gap-1 text-xs text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // List view
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.99]">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-center min-w-0">
            <h3 className="font-semibold text-sm leading-tight text-foreground truncate">
              {item.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[item.category] || categoryColors.Other}`}>
                {item.category}
              </span>
              <Badge variant={expStatus.variant} className="text-xs">
                {expStatus.label}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Qty: {item.quantity}</span>
              {item.weight && <span>{item.weight} {item.weight_unit}</span>}
            </div>
          </div>

          {/* Actions — always visible, not hover-gated */}
          <div className="flex flex-col justify-center gap-1 pl-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onEdit(item) }}
              aria-label="Edit item"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
