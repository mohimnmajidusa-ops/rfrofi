import { AiChatView } from '@/components/ai-chat-view'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'AI Chef - Rafofi',
  description: 'Get AI-powered meal and diet suggestions based on your food inventory.',
}

export default function AiPage() {
  return (
    <>
      <AiChatView />
      <Toaster position="top-center" richColors />
    </>
  )
}
