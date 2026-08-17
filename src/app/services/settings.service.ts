import { apiFetch } from './api'
import type { Store, StoreSettings } from '../types'

function normalizeSettings(s: any): StoreSettings {
  return {
    ai_api_key: s.ai_api_key || '',
    ai_model: s.ai_model || 'gemini-1.5-flash',
    ai_temperature: Number(s.ai_temperature) ?? 0.7,
    ai_system_prompt: s.ai_system_prompt || '',
    ticket_encabezado: s.ticket_encabezado || '',
    ticket_pie: s.ticket_pie || 'Gracias por su compra',
    ticket_mostrar_iva: !!Number(s.ticket_mostrar_iva),
    notif_stock_bajo: !!Number(s.notif_stock_bajo),
    notif_resumen_diario: !!Number(s.notif_resumen_diario),
    notif_agotados: !!Number(s.notif_agotados),
    notif_ia: !!Number(s.notif_ia),
    billing_plan: s.billing_plan || 'Básico',
    billing_ciclo: s.billing_ciclo || 'mensual',
    billing_email: s.billing_email || '',
    billing_tarjeta: s.billing_tarjeta || '',
    billing_proxima_cobro: s.billing_proxima_cobro || '',
  }
}

function toFlags(s: StoreSettings) {
  return {
    stock_bajo: s.notif_stock_bajo ? 1 : 0,
    resumen_diario: s.notif_resumen_diario ? 1 : 0,
    agotados: s.notif_agotados ? 1 : 0,
    ia: s.notif_ia ? 1 : 0,
  }
}

export class SettingsService {
  static async getSettings(): Promise<{ store: Store; settings: StoreSettings }> {
    const data = await apiFetch<{ store: Store; settings: any }>('/settings')
    return { store: data.store, settings: normalizeSettings(data.settings) }
  }

  static async updateStore(data: Partial<Store>): Promise<Store> {
    const res = await apiFetch<{ store: Store }>('/settings/store', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.store
  }

  static async updateAI(data: { api_key?: string; model?: string; temperature?: number; system_prompt?: string }): Promise<StoreSettings> {
    const res = await apiFetch<{ settings: any }>('/settings/ai', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return normalizeSettings(res.settings)
  }

  static async updateTickets(data: { encabezado?: string; pie?: string; mostrar_iva?: boolean }): Promise<StoreSettings> {
    const body: any = { ...data }
    if (body.mostrar_iva !== undefined) body.mostrar_iva = body.mostrar_iva ? 1 : 0
    const res = await apiFetch<{ settings: any }>('/settings/tickets', {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    return normalizeSettings(res.settings)
  }

  static async updateNotifications(data: StoreSettings): Promise<StoreSettings> {
    const res = await apiFetch<{ settings: any }>('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(toFlags(data)),
    })
    return normalizeSettings(res.settings)
  }

  static async updateBilling(data: { plan?: string; ciclo?: string; email?: string; tarjeta?: string; proxima_cobro?: string }): Promise<StoreSettings> {
    const res = await apiFetch<{ settings: any }>('/settings/billing', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return normalizeSettings(res.settings)
  }

  static async checkout(data: { plan: string; ciclo: string; email?: string; card_last4?: string }): Promise<StoreSettings> {
    const res = await apiFetch<{ ok: boolean; settings: any }>('/settings/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return normalizeSettings(res.settings)
  }
}