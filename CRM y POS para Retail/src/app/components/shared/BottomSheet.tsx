import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

export function BottomSheet({ isOpen, onClose, title, children, fullHeight = false }: {
  isOpen: boolean; onClose: () => void; title?: string; children: ReactNode; fullHeight?: boolean
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-card rounded-t-3xl shadow-2xl flex flex-col ${fullHeight ? 'max-h-[92vh]' : 'max-h-[85vh]'} overflow-hidden`}>
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border/50 shrink-0">
            <h3 className="font-bold text-foreground text-base">{title}</h3>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center cursor-pointer"><X size={15} /></button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}
