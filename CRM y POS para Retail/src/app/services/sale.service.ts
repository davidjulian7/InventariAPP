import { db } from '../lib/data'
import type { Sale } from '../types'
import { generateFolio } from '../lib/utils'
import { IVA_RATE } from '../lib/constants'

export class SaleService {
  static async getTodaySales(storeId: number): Promise<Sale[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const ventas = db.query<any>('venta', (v: any) =>
      v.tienda_id === storeId && new Date(v.fecha || v.created_at) >= today
    )
    return ventas
      .sort((a: any, b: any) => new Date(b.fecha || b.created_at).getTime() - new Date(a.fecha || a.created_at).getTime())
      .map((v: any) => this.withItems(v))
  }

  static async getByPeriod(storeId: number, startDate: string, endDate: string): Promise<Sale[]> {
    const ventas = db.query<any>('venta', (v: any) =>
      v.tienda_id === storeId && (v.fecha || v.created_at) >= startDate && (v.fecha || v.created_at) <= endDate
    )
    return ventas
      .sort((a: any, b: any) => new Date(b.fecha || b.created_at).getTime() - new Date(a.fecha || a.created_at).getTime())
      .map((v: any) => this.withItems(v))
  }

  static async getRecent(storeId: number, limit = 5): Promise<Sale[]> {
    const ventas = db.getAll<any>('venta')
      .filter((v: any) => v.tienda_id === storeId)
      .sort((a: any, b: any) => new Date(b.fecha || b.created_at).getTime() - new Date(a.fecha || a.created_at).getTime())
      .slice(0, limit)
    return ventas.map((v: any) => this.withItems(v))
  }

  static async create(cart: { id: number; codigo: string; nombre: string; precio: number; qty: number }[], metodoPago: string, storeId: number, userId: number): Promise<Sale> {
    const subtotal = cart.reduce((sum, item) => sum + item.precio * item.qty, 0)
    const iva = subtotal * IVA_RATE
    const total = subtotal + iva

    const allVentas = db.getAll<any>('venta')
    const lastId = allVentas.length > 0 ? Math.max(...allVentas.map((v: any) => v.id)) : 0
    const folio = generateFolio('V', lastId + 1)

    const venta = db.insert('venta', {
      fecha: new Date().toISOString(),
      total,
      metodo_pago: metodoPago,
      tienda_id: storeId,
    })

    for (const item of cart) {
      db.insert('venta_detalle', {
        cantidad: item.qty,
        precio_unitario: item.precio,
        subtotal: item.precio * item.qty,
        venta_id: venta.id,
        producto_id: item.id,
      })

      const invs = db.query<any>('inventario', (i: any) => i.producto_id === item.id && i.tienda_id === storeId)
      if (invs.length > 0) {
        db.update('inventario', invs[0].id, {
          cantidad: Math.max(0, invs[0].cantidad - item.qty),
        })
      }

      db.insert('inventory_movements', {
        producto_id: item.id,
        tipo: 'salida',
        cantidad: item.qty,
        motivo: `Venta ${folio}`,
        store_id: storeId,
      })
    }

    return {
      ...this.withItems(venta),
      folio,
    }
  }

  static async getDailyTotals(storeId: number): Promise<{ total: number; count: number; promedio: number }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const ventas = db.query<any>('venta', (v: any) =>
      v.tienda_id === storeId && new Date(v.fecha || v.created_at) >= today
    )
    const total = ventas.reduce((sum: number, v: any) => sum + Number(v.total), 0)
    return {
      total,
      count: ventas.length,
      promedio: ventas.length > 0 ? total / ventas.length : 0,
    }
  }

  private static withItems(venta: any): Sale {
    const detalles = db.query<any>('venta_detalle', (d: any) => d.venta_id === venta.id)
    const items = detalles.map((d: any) => ({
      id: d.id,
      venta_id: d.venta_id,
      producto_id: d.producto_id,
      nombre: d.nombre || '',
      precio: d.precio_unitario,
      qty: d.cantidad,
      subtotal: d.subtotal,
    }))

    const total = venta.total || items.reduce((s: number, i: any) => s + i.subtotal, 0)

    return {
      id: venta.id,
      folio: venta.folio || `#V-${String(venta.id).padStart(4, '0')}`,
      cliente: 'Cliente general',
      total,
      metodo_pago: (venta.metodo_pago || 'efectivo') as 'efectivo' | 'transferencia' | 'terminal',
      items,
      created_at: venta.fecha || venta.created_at,
    }
  }
}

/* fix: SaleService.create accepts userId as number now */
