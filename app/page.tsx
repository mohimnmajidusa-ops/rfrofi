import { InventoryView } from '@/components/inventory-view'
import { Toaster } from 'sonner'

export default function Home() {
  return (
    <>
      <InventoryView />
      <Toaster position="top-center" richColors />
    </>
  )
}
