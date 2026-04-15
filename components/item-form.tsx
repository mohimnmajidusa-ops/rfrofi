'use client'

import { useState, useEffect } from 'react'
import { Item, ItemInput, ItemTemplate, CATEGORIES, WEIGHT_UNITS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, ImageIcon, X, BookmarkPlus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { TemplateGallery } from './template-gallery'
import { toast } from 'sonner'

interface ItemFormProps {
  item?: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ItemInput) => Promise<void>
}

export function ItemForm({ item, open, onOpenChange, onSubmit }: ItemFormProps) {
  const [loading, setLoading] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('Other')
  const [quantity, setQuantity] = useState(1)
  const [weight, setWeight] = useState<string>('')
  const [weightUnit, setWeightUnit] = useState<string>('g')
  const [expirationDate, setExpirationDate] = useState<Date | undefined>()
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    if (item) {
      setName(item.name)
      setCategory(item.category)
      setQuantity(item.quantity)
      setWeight(item.weight?.toString() || '')
      setWeightUnit(item.weight_unit)
      setExpirationDate(item.expiration_date ? new Date(item.expiration_date) : undefined)
      setImageUrl(item.image_url || '')
    } else {
      setName('')
      setCategory('Other')
      setQuantity(1)
      setWeight('')
      setWeightUnit('g')
      setExpirationDate(undefined)
      setImageUrl('')
    }
  }, [item, open])

  const handleSelectTemplate = (template: ItemTemplate) => {
    setName(template.name)
    setImageUrl(template.image_url || '')
  }

  const handleSaveAsTemplate = async () => {
    if (!name.trim()) return
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), image_url: imageUrl || null }),
      })
      if (!res.ok) throw new Error('Failed to save template')
      toast.success('Saved as template')
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        name,
        category,
        quantity,
        weight: weight ? parseFloat(weight) : null,
        weight_unit: weightUnit,
        expiration_date: expirationDate ? format(expirationDate, 'yyyy-MM-dd') : null,
        image_url: imageUrl || null,
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>{item ? 'Edit Item' : 'Add New Item'}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto pb-8">
          {/* Template Gallery — only shown when adding a new item */}
          {!item && (
            <TemplateGallery onSelect={handleSelectTemplate} />
          )}

          {/* Image Preview */}
          <div className="flex justify-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-muted">
              {imageUrl ? (
                <>
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => setImageUrl('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>
          
          {/* Image URL Input */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          
          {/* Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Name *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground',
                  !name.trim() && 'invisible'
                )}
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate || !name.trim()}
              >
                {savingTemplate ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  <BookmarkPlus className="h-3.5 w-3.5" />
                )}
                Save as template
              </Button>
            </div>
            <Input
              id="name"
              placeholder="e.g., Organic Milk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
          
          {/* Weight */}
          <div className="space-y-2">
            <Label>Weight (optional)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1"
              />
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Expiration Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expirationDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {expirationDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpirationDate(undefined)}
                className="text-muted-foreground"
              >
                Clear date
              </Button>
            )}
          </div>
          
          {/* Submit Button */}
          <Button type="submit" size="lg" className="mt-4" disabled={loading || !name}>
            {loading ? <Spinner className="mr-2" /> : null}
            {item ? 'Save Changes' : 'Add Item'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
