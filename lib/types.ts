export interface Item {
  id: string
  name: string
  image_url: string | null
  category: string
  weight: number | null
  weight_unit: string
  quantity: number
  expiration_date: string | null
  created_at: string
  updated_at: string
}

export type ItemInput = Omit<Item, 'id' | 'created_at' | 'updated_at'>

export const CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Meat',
  'Seafood',
  'Bakery',
  'Frozen',
  'Beverages',
  'Snacks',
  'Condiments',
  'Canned Goods',
  'Grains',
  'Other'
] as const

export type Category = typeof CATEGORIES[number]

export const WEIGHT_UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'L'] as const
export type WeightUnit = typeof WEIGHT_UNITS[number]

export type SortOption = 'name' | 'expiration' | 'category' | 'created'
export type SortDirection = 'asc' | 'desc'

export interface ItemTemplate {
  id: string
  name: string
  image_url: string | null
  created_at: string
}
