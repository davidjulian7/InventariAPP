const TZ_OFFSET_HOURS = -6
const SHIFT_MS = Math.abs(TZ_OFFSET_HOURS) * 3600_000

export function parseServerDate(value?: string): Date | null {
  if (!value) return null
  const normalized = value.includes('T') ? value : value.replace(' ', 'T') + 'Z'
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

export function toUTC6(date: Date): Date {
  return new Date(date.getTime() - SHIFT_MS)
}

export function nowUTC6(): Date {
  return toUTC6(new Date())
}

export function formatUTC6Time(value?: string): string {
  const d = parseServerDate(value)
  if (!d) return '—'
  const s = toUTC6(d)
  return `${String(s.getUTCHours()).padStart(2, '0')}:${String(s.getUTCMinutes()).padStart(2, '0')}`
}

export function formatUTC6Date(value?: string): string {
  const d = parseServerDate(value)
  if (!d) return '—'
  const s = toUTC6(d)
  return s.toLocaleDateString('es-MX', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatUTC6DateTime(value?: string): string {
  const d = parseServerDate(value)
  if (!d) return '—'
  const s = toUTC6(d)
  return (
    s.toLocaleDateString('es-MX', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    ' · ' + s.toLocaleTimeString('es-MX', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })
  )
}

export type ReportPeriod = 'dia' | 'semana' | 'mes' | 'trimestre'

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  dia: 'Hoy',
  semana: 'Última semana',
  mes: 'Últimos 30 días',
  trimestre: 'Últimos 90 días',
}

const PERIOD_DAYS: Record<ReportPeriod, number> = {
  dia: 1,
  semana: 7,
  mes: 30,
  trimestre: 90,
}

export function utc6DateString(ms?: number): string {
  return new Date((ms ?? Date.now()) - SHIFT_MS).toISOString().slice(0, 10)
}

export function getPeriodRange(period: ReportPeriod): { start: string; end: string; days: number } {
  const days = PERIOD_DAYS[period]
  const endMs = Date.now()
  const startMs = endMs - (days - 1) * 86_400_000
  return { start: utc6DateString(startMs), end: utc6DateString(endMs), days }
}

export function getPreviousPeriodRange(period: ReportPeriod): { start: string; end: string } {
  const days = PERIOD_DAYS[period]
  const endMs = Date.now() - days * 86_400_000
  const startMs = endMs - (days - 1) * 86_400_000
  return { start: utc6DateString(startMs), end: utc6DateString(endMs) }
}