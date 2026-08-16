import { apiFetch } from './api'
import type { Sale } from '../types'

export class SaleService {
  static async getTodaySales(storeId: number): Promise<Sale[]> {
    return apiFetch<Sale[]>('/sales?today=true')
  }

  static async getByPeriod(storeId: number, startDate: string, endDate: string): Promise<Sale[]> {
    return apiFetch<Sale[]>(
      `/sales?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    )
  }

  static async getRecent(storeId: number, limit = 5): Promise<Sale[]> {
    return apiFetch<Sale[]>(`/sales?recent=true&limit=${limit}`)
  }

  static async create(
    cart: { id: number; codigo: string; nombre: string; precio: number; qty: number }[],
    metodoPago: string,
    storeId: number,
    userId: number
  ): Promise<Sale> {
    return apiFetch<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify({ items: cart, metodo_pago: metodoPago }),
    })
  }

  static async getDailyTotals(storeId: number): Promise<{ total: number; count: number; promedio: number }> {
    return apiFetch<{ total: number; count: number; promedio: number }>('/sales/daily-totals')
  }
}