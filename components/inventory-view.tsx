'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import { Item, ItemInput, SortOption, SortDirection } from '@/lib/types'
import { ItemCard, ViewMode } from './item-card'
import { ItemForm } from './item-form'
import { FilterBar } from './filter-bar'
import { Button } from '@/components/ui/button'
import { Plus, Package, LayoutGrid, List, ChefHat } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function InventoryView() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortOption>('created')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>('list')

  const debouncedSearch = useDebounce(search, 300)

  const queryParams = new URLSearchParams({
    category,
    sort,
    direction,
    ...(debouncedSearch && { search: debouncedSearch }),
  })

  const { data: items, error, isLoading, mutate } = useSWR<Item[]>(
    `/api/items?${queryParams}`,
    fetcher
  )

  const handleAdd = useCallback(() => {
    setEditingItem(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item)
    setFormOpen(true)
  }, [])

  const handleSubmit = async (data: ItemInput) => {
    try {
      if (editingItem) {
        const res = await fetch(`/api/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to update')
        toast.success('Item updated successfully')
      } else {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to add')
        toast.success('Item added successfully')
      }
      mutate()
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      const res = await fetch(`/api/items/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Item deleted')
      mutate()
    } catch {
      toast.error('Failed to delete item')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-24">
        {/* Header */}
        <header className="flex items-start justify-between py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              My Inventory
            </h1>
            <p className="text-sm text-muted-foreground">
              {items?.length ?? 0} items tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Chef link */}
            <Link href="/ai">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs font-medium"
                aria-label="Open AI Chef"
              >
                <ChefHat className="h-3.5 w-3.5" />
                AI Chef
              </Button>
            </Link>
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md transition-colors ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md transition-colors ${view === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                onClick={() => setView('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Filters */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
          direction={direction}
          onDirectionChange={setDirection}
        />

        {/* Item List */}
        <div className={`pt-2 ${view === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={view === 'grid' ? 'aspect-square w-full rounded-xl' : 'h-24 w-full rounded-xl'} />
            ))
          ) : error ? (
            <div className="col-span-2 py-12 text-center">
              <p className="text-destructive">Failed to load items</p>
              <Button variant="outline" className="mt-4" onClick={() => mutate()}>
                Try again
              </Button>
            </div>
          ) : items?.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No items yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || category !== 'All'
                  ? 'No items match your filters'
                  : 'Add your first item to get started'}
              </p>
              {!search && category === 'All' && (
                <Button className="mt-4" onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              )}
            </div>
          ) : (
            items?.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
                view={view}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        onClick={handleAdd}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Add item</span>
      </Button>

      {/* Item Form Sheet */}
      <ItemForm
        item={editingItem}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
