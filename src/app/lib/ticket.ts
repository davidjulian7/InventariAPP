import { formatUTC6DateTime } from './dates'

export const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  terminal: 'Terminal',
}

export const PAYMENT_STYLES: Record<string, string> = {
  efectivo: 'bg-green-100 text-green-700',
  transferencia: 'bg-blue-100 text-blue-700',
  terminal: 'bg-purple-100 text-purple-700',
}

export interface TicketItem {
  nombre: string
  precio: number
  qty: number
}

export interface TicketData {
  folio: string
  items: TicketItem[]
  subtotal: number
  iva: number
  total: number
  monto_pagado?: number
  adeudo?: number
  created_at?: string
}

export function ticketFilename(folio: string): string {
  return `ticket-${folio.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`
}

export function buildTicketText(t: TicketData): string {
  const lines = [
    'ABARROTES EL ROBLE',
    'Calle Principal 45, CDMX',
    formatUTC6DateTime(t.created_at),
    `Ticket ${t.folio}`,
    '--------------------------------',
    ...t.items.map(it => `${it.nombre} x${it.qty}\t$${(it.precio * it.qty).toFixed(2)}`),
    '--------------------------------',
    `Subtotal:\t$${t.subtotal.toFixed(2)}`,
    `IVA 16%:\t$${t.iva.toFixed(2)}`,
    `TOTAL:\t$${t.total.toFixed(2)}`,
  ]
  if ((t.adeudo ?? 0) > 0) {
    lines.push(`Pago recibido:\t$${(t.monto_pagado ?? 0).toFixed(2)}`)
    lines.push(`ADEUDO PENDIENTE:\t$${t.adeudo.toFixed(2)}`)
  }
  lines.push('', 'Gracias por su compra')
  return lines.join('\n')
}

export async function generateTicketPdf(t: TicketData): Promise<{ doc: any; filename: string }> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()
  const ml = 20
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('ABARROTES EL ROBLE', pw / 2, y, { align: 'center' })
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Calle Principal 45, CDMX', pw / 2, y, { align: 'center' })
  y += 5
  doc.text(formatUTC6DateTime(t.created_at), pw / 2, y, { align: 'center' })
  y += 5
  doc.text(`Ticket ${t.folio}`, pw / 2, y, { align: 'center' })
  y += 8

  doc.setDrawColor(180)
  doc.line(ml, y, pw - ml, y)
  y += 7

  for (const it of t.items) {
    const name = it.nombre.length > 26 ? it.nombre.slice(0, 26) + '...' : it.nombre
    doc.text(`${name}  x${it.qty}`, ml, y)
    doc.text(`$${(it.precio * it.qty).toFixed(2)}`, pw - ml, y, { align: 'right' })
    y += 6
  }

  doc.line(ml, y, pw - ml, y)
  y += 7
  doc.text('Subtotal', ml, y)
  doc.text(`$${t.subtotal.toFixed(2)}`, pw - ml, y, { align: 'right' })
  y += 6
  doc.text('IVA 16%', ml, y)
  doc.text(`$${t.iva.toFixed(2)}`, pw - ml, y, { align: 'right' })
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('TOTAL', ml, y)
  doc.text(`$${t.total.toFixed(2)}`, pw - ml, y, { align: 'right' })
  y += 7

  if ((t.adeudo ?? 0) > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Pago recibido', ml, y)
    doc.text(`$${(t.monto_pagado ?? 0).toFixed(2)}`, pw - ml, y, { align: 'right' })
    y += 6
    doc.setTextColor(220, 38, 38)
    doc.text('ADEUDO', ml, y)
    doc.text(`$${t.adeudo.toFixed(2)}`, pw - ml, y, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y += 8
  } else {
    y += 10
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Gracias por su compra', pw / 2, y, { align: 'center' })

  return { doc, filename: ticketFilename(t.folio) }
}

export function saleToTicketData(sale: {
  folio: string
  items: TicketItem[]
  subtotal?: number
  iva?: number
  total: number
  monto_pagado?: number
  adeudo?: number
  created_at?: string
}): TicketData {
  const subtotal = sale.subtotal ?? 0
  const iva = sale.iva ?? 0
  const total = sale.total
  const montoPagado = sale.monto_pagado ?? total
  return {
    folio: sale.folio,
    items: sale.items,
    subtotal,
    iva,
    total,
    monto_pagado: montoPagado,
    adeudo: sale.adeudo ?? Math.max(0, total - montoPagado),
    created_at: sale.created_at,
  }
}