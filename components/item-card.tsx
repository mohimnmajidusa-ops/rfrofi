'use client'

import { Item } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Package } from 'lucide-react'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import Image from 'next/image'

interface ItemCardProps {
  item: Item
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
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

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const expStatus = getExpirationStatus(item.expiration_date)
  
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Image */}
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <h3 className="font-semibold leading-tight text-foreground line-clamp-1">
                {item.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[item.category] || categoryColors.Other}`}>
                  {item.category}
                </span>
                <Badge variant={expStatus.variant} className="text-xs">
                  {expStatus.label}
                </Badge>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Qty: {item.quantity}</span>
              {item.weight && (
                <span>{item.weight} {item.weight_unit}</span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
