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

  static async getById(id: number): Promise<Sale> {
    return apiFetch<Sale>(`/sales/${id}`)
  }

  static async create(
    cart: { id: number; codigo: string; nombre: string; precio: number; qty: number }[],
    metodoPago: string,
    storeId: number,
    userId: number,
    montoPagado?: number
  ): Promise<Sale> {
    return apiFetch<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify({ items: cart, metodo_pago: metodoPago, monto_pagado: montoPagado }),
    })
  }

  static async update(id: number, data: Partial<Sale>): Promise<Sale> {
    return apiFetch<Sale>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async delete(id: number): Promise<void> {
    await apiFetch(`/sales/${id}`, { method: 'DELETE' })
  }

  static async getDailyTotals(storeId: number): Promise<{ total: number; count: number; promedio: number }> {
    return apiFetch<{ total: number; count: number; promedio: number }>('/sales/daily-totals')
  }
}