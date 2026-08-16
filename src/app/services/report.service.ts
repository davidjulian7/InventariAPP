import { apiFetch } from './api'
import type { TopProduct, SalesChartData, ReportSummary, CategoryData, MonthlyData, CashFlow } from '../types'

export class ReportService {
  static async getSalesChartData(storeId: number, days = 7): Promise<SalesChartData[]> {
    return apiFetch<SalesChartData[]>(`/reports/sales-chart?days=${days}`)
  }

  static async getTopProducts(storeId: number, limit = 5, startDate?: string, endDate?: string): Promise<TopProduct[]> {
    const q = new URLSearchParams({ limit: String(limit) })
    if (startDate) q.set('start', startDate)
    if (endDate) q.set('end', endDate)
    return apiFetch<TopProduct[]>(`/reports/top-products?${q.toString()}`)
  }

  static async getSummary(storeId: number, startDate: string, endDate: string): Promise<ReportSummary> {
    return apiFetch<ReportSummary>(
      `/reports/summary?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    )
  }

  static async getCategories(storeId: number, startDate: string, endDate: string): Promise<CategoryData[]> {
    return apiFetch<CategoryData[]>(
      `/reports/categories?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    )
  }

  static async getMonthly(storeId: number, months = 6): Promise<MonthlyData[]> {
    return apiFetch<MonthlyData[]>(`/reports/monthly?months=${months}`)
  }

  static async getCashFlow(storeId: number, startDate: string, endDate: string): Promise<CashFlow> {
    return apiFetch<CashFlow>(
      `/reports/cash-flow?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
    )
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