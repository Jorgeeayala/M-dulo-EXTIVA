import { ToastMessage } from '../types'

interface ToastProps {
  messages: ToastMessage[]
}

export default function Toast({ messages }: ToastProps) {
  if (messages.length === 0) return null

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-[var(--green)]'
      case 'error': return 'border-l-[var(--red)]'
      case 'warning': return 'border-l-[var(--yellow)]'
      default: return 'border-l-[var(--accent)]'
    }
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-24px)] max-w-md pointer-events-none">
      {messages.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2.5 bg-[var(--bg-card)] rounded shadow-[0_4px_16px_rgba(0,0,0,0.4)] text-xs border-l-[3px] ${getBorderColor(toast.type)} pointer-events-auto`}
          style={{ animation: 'toastIn 0.25s ease' }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
