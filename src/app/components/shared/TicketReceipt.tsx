import type { TicketData } from '../../lib/ticket'
import { formatUTC6DateTime } from '../../lib/dates'

export function TicketReceipt({ data }: { data: TicketData }) {
  return (
    <div className="bg-muted rounded-xl p-4 font-mono text-xs text-foreground">
      <div className="text-center mb-3">
        <div className="font-bold text-sm">ABARROTES EL ROBLE</div>
        <div className="text-muted-foreground">Calle Principal 45, CDMX</div>
        <div className="text-muted-foreground">{formatUTC6DateTime(data.created_at)}</div>
        <div className="mt-1 font-semibold">Ticket {data.folio}</div>
      </div>
      <div className="border-t border-dashed border-border my-2" />
      {data.items.map((it, i) => (
        <div key={i} className="flex justify-between py-0.5">
          <span className="truncate mr-2">{it.nombre} x{it.qty}</span>
          <span className="shrink-0">${(it.precio * it.qty).toFixed(2)}</span>
        </div>
      ))}
      <div className="border-t border-dashed border-border my-2" />
      <div className="flex justify-between"><span>Subtotal</span><span>${data.subtotal.toFixed(2)}</span></div>
      <div className="flex justify-between"><span>IVA 16%</span><span>${data.iva.toFixed(2)}</span></div>
      <div className="flex justify-between font-bold border-t border-dashed border-border mt-1 pt-1"><span>TOTAL</span><span>${data.total.toFixed(2)}</span></div>
      {(data.adeudo ?? 0) > 0 && (
        <>
          <div className="flex justify-between pt-1"><span>Pago recibido</span><span>${(data.monto_pagado ?? 0).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-red-500 border-t border-dashed border-border mt-1 pt-1"><span>ADEUDO</span><span>${data.adeudo!.toFixed(2)}</span></div>
        </>
      )}
    </div>
  )
}