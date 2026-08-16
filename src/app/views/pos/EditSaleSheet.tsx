import { useState } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { Btn } from '../../components/shared/Button'
import { SaleService } from '../../services/sale.service'
import { PAYMENT_LABELS } from '../../lib/ticket'
import type { Sale } from '../../types'

export function EditSaleSheet({ sale, isOpen, onClose, onSaved }: {
  sale: Sale; isOpen: boolean; onClose: () => void; onSaved: () => void
}) {
  const [cliente, setCliente] = useState(sale.cliente)
  const [metodoPago, setMetodoPago] = useState(sale.metodo_pago)
  const [montoPagado, setMontoPagado] = useState(String(sale.monto_pagado ?? sale.total))
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setCliente(sale.cliente)
    setMetodoPago(sale.metodo_pago)
    setMontoPagado(String(sale.monto_pagado ?? sale.total))
  }

  const save = async () => {
    const paid = Math.max(0, Math.min(parseFloat(montoPagado) || 0, sale.total))
    try {
      setSaving(true)
      await SaleService.update(sale.id, {
        cliente: cliente.trim() || 'Cliente general',
        metodo_pago: metodoPago,
        monto_pagado: paid,
      })
      toast.success('Venta actualizada')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la venta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Editar venta ${sale.folio}`}>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Cliente</label>
          <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Cliente general"
            className="w-full mt-1.5 px-3 py-3 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Método de pago</label>
          <select value={metodoPago} onChange={e => setMetodoPago(e.target.value as Sale['metodo_pago'])}
            className="w-full mt-1.5 px-3 py-3 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]">
            {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Monto pagado</label>
          <input type="number" min={0} max={sale.total} step={0.01} value={montoPagado}
            onChange={e => setMontoPagado(e.target.value)}
            className="w-full mt-1.5 px-3 py-3 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]" />
          <div className="flex justify-between text-xs mt-2">
            <span className="text-muted-foreground">Total de la venta: <b className="text-foreground">${sale.total.toFixed(2)}</b></span>
            {(parseFloat(montoPagado) || 0) < sale.total && (
              <span className="text-red-600 font-semibold">Adeudo: ${(sale.total - (parseFloat(montoPagado) || 0)).toFixed(2)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Btn variant="outline" className="flex-1 min-h-[48px]" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" className="flex-1 min-h-[48px]" disabled={saving} onClick={save}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  )
}