import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X, MessageCircle, Mail, Download } from 'lucide-react'
import { TicketReceipt } from '../../components/shared/TicketReceipt'
import { Btn } from '../../components/shared/Button'
import { PdfPreviewModal } from './PdfPreviewModal'
import { buildTicketText, generateTicketPdf, saleToTicketData, PAYMENT_LABELS, PAYMENT_STYLES } from '../../lib/ticket'
import { formatUTC6DateTime } from '../../lib/dates'
import type { Sale } from '../../types'

export function TicketModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const data = saleToTicketData(sale)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendWhatsApp = () => {
    const text = buildTicketText(data)
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')
    toast.success('Abriendo WhatsApp...')
  }

  const sendEmail = () => {
    const subject = `Ticket ${data.folio} - Abarrotes El Roble`
    const body = buildTicketText(data)
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)
    toast.success('Abriendo cliente de correo...')
  }

  const openPDF = async () => {
    try {
      toast.loading('Generando PDF...', { id: 'pdf-preview' })
      const { doc, filename } = await generateTicketPdf(data)
      const url = URL.createObjectURL(doc.output('blob'))
      setPdfUrl(url)
      toast.success('PDF generado', { id: 'pdf-preview' })
    } catch (err: any) {
      toast.error(err.message || 'Error al generar el PDF', { id: 'pdf-preview' })
    }
  }

  const isAdeudo = (data.adeudo ?? 0) > 0

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-sm">Ticket {sale.folio}</h3>
            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${PAYMENT_STYLES[sale.metodo_pago] || 'bg-muted text-muted-foreground'}`}>
              {PAYMENT_LABELS[sale.metodo_pago] || sale.metodo_pago}
            </span>
            {isAdeudo && <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Adeudo</span>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center cursor-pointer" aria-label="Cerrar"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs text-muted-foreground">{formatUTC6DateTime(sale.created_at)}</div>
          <TicketReceipt data={data} />
          <div className="flex flex-col gap-2">
            <Btn variant="primary" className="w-full min-h-[48px]" onClick={sendWhatsApp}><MessageCircle size={15} />WhatsApp</Btn>
            <Btn variant="outline" className="w-full min-h-[48px]" onClick={sendEmail}><Mail size={15} />Correo</Btn>
            <Btn variant="outline" className="w-full min-h-[48px]" onClick={openPDF}><Download size={15} />Ver PDF</Btn>
          </div>
        </div>
      </div>
      {pdfUrl && <PdfPreviewModal url={pdfUrl} filename={`ticket-${data.folio}.pdf`} onClose={() => setPdfUrl(null)} />}
    </div>,
    document.body
  )
}