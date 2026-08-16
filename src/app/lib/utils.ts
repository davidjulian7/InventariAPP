import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date: Date | string, locale = 'es-MX'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatTime(date: Date | string, locale = 'es-MX'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(date: Date | string, locale = 'es-MX'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(d, locale)} ${formatTime(d, locale)}`
}

export function calculateMargen(precioCompra: number, precioVenta: number): number {
  if (precioVenta === 0) return 0
  return ((precioVenta - precioCompra) / precioVenta) * 100
}

export function generateFolio(prefix = 'V', num: number): string {
  return `#${prefix}-${String(num).padStart(4, '0')}`
}

export function getStockStatus(existencia: number, stockMin: number): 'ok' | 'bajo' | 'agotado' {
  if (existencia <= 0) return 'agotado'
  if (existencia < stockMin) return 'bajo'
  return 'ok'
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
