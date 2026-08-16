import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download } from 'lucide-react'

export function PdfPreviewModal({ url, filename, onClose, title = 'Vista previa' }: {
  url: string; filename: string; onClose: () => void; title?: string
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const download = () => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <h3 className="font-bold text-foreground text-sm">{title}</h3>
          <div className="flex items-center gap-2">
            <button onClick={download}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer min-h-[40px] hover:bg-secondary transition-colors">
              <Download size={14} />Descargar
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center cursor-pointer" aria-label="Cerrar"><X size={15} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-muted/50 p-3">
          <iframe src={url} title="Ticket PDF" className="w-full h-[70vh] rounded-xl border border-border/50 bg-white" />
        </div>
      </div>
    </div>,
    document.body
  )
}