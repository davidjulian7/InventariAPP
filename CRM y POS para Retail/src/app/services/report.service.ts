import { db } from '../lib/data'
import type { TopProduct, SalesChartData } from '../types'

export class ReportService {
  static async getSalesChartData(storeId: number, days = 7): Promise<SalesChartData[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const ventas = db.query<any>('venta', (v: any) =>
      v.tienda_id === storeId &&
      (v.fecha || v.created_at) >= startDate.toISOString() &&
      (v.fecha || v.created_at) <= endDate.toISOString()
    )

    const dayMap: Record<string, { ventas: number; ganancia: number; count: number }> = {}
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      dayMap[d.toISOString().split('T')[0]] = { ventas: 0, ganancia: 0, count: 0 }
    }

    for (const v of ventas) {
      const key = new Date(v.fecha || v.created_at).toISOString().split('T')[0]
      if (dayMap[key]) {
        dayMap[key].ventas += Number(v.total)
        dayMap[key].ganancia += Number(v.total) * 0.25
        dayMap[key].count++
      }
    }

    return Object.entries(dayMap).map(([date, vals]) => ({
      dia: dayNames[new Date(date).getDay()],
      ventas: vals.ventas,
      ganancia: vals.ganancia,
    }))
  }

  static async getTopProducts(storeId: number, limit = 5): Promise<TopProduct[]> {
    const ventaDetalles = db.getAll<any>('venta_detalle')
    const ventas = db.getAll<any>('venta').filter((v: any) => v.tienda_id === storeId)
    const ventaIds = new Set(ventas.map((v: any) => v.id))
    const items = ventaDetalles.filter((d: any) => ventaIds.has(d.venta_id))

    const grouped: Record<string, TopProduct> = {}
    for (const item of items) {
      const prod = db.getById<any>('producto', item.producto_id)
      const name = prod ? prod.nombre : `Producto #${item.producto_id}`
      if (!grouped[name]) {
        grouped[name] = { nombre: name, ventas: 0, ingresos: 0, margen: 0 }
      }
      grouped[name].ventas += Number(item.cantidad)
      grouped[name].ingresos += Number(item.subtotal)
    }

    return Object.values(grouped)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, limit)
  }

  static async getTotalSales(storeId: number, startDate: string, endDate: string): Promise<number> {
    const ventas = db.query<any>('venta', (v: any) =>
      v.tienda_id === storeId &&
      (v.fecha || v.created_at) >= startDate &&
      (v.fecha || v.created_at) <= endDate
    )
    return ventas.reduce((sum: number, v: any) => sum + Number(v.total), 0)
  }

  static async getSalesCount(storeId: number, startDate: string, endDate: string): Promise<number> {
    return db.query<any>('venta', (v: any) =>
      v.tienda_id === storeId &&
      (v.fecha || v.created_at) >= startDate &&
      (v.fecha || v.created_at) <= endDate
    ).length
  }
}
