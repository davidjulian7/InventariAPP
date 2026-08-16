import { apiFetch } from './api'
import type { TopProduct, SalesChartData } from '../types'

export class ReportService {
  static async getSalesChartData(storeId: number, days = 7): Promise<SalesChartData[]> {
    return apiFetch<SalesChartData[]>(`/reports/sales-chart?days=${days}`)
  }

  static async getTopProducts(storeId: number, limit = 5): Promise<TopProduct[]> {
    return apiFetch<TopProduct[]>(`/reports/top-products?limit=${limit}`)
  }

  static async getTotalSales(storeId: number, startDate: string, endDate: string): Promise<number> {
    const data = await apiFetch<{ total: number }>(
      `/reports/totals?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    )
    return data.total
  }

  static async getSalesCount(storeId: number, startDate: string, endDate: string): Promise<number> {
    const data = await apiFetch<{ count: number }>(
      `/reports/totals?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    )
    return data.count
  }
}