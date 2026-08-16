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