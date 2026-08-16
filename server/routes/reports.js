import { Router } from 'express'
import db from '../db.js'

const router = Router()
const CATEGORY_COLORS = ['#628141', '#8BAE66', '#EBD5AB', '#3D5428', '#C4A87A', '#7F9B68', '#D9C9A3', '#59793B']
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function round2(n) {
  return Math.round(n * 100) / 100
}

function clamp(n, min, max, fallback) {
  const v = Number(n)
  if (isNaN(v)) return fallback
  return Math.min(Math.max(v, min), max)
}

function utc6DateStr(ms) {
  return new Date(ms - 6 * 3600_000).toISOString().slice(0, 10)
}

function parseRange(req) {
  const { start, end } = req.query
  return {
    start: String(start || ''),
    end: String(end || ''),
  }
}

function hasRange(r) {
  return Boolean(r.start && r.end)
}

router.get('/sales-chart', (req, res) => {
  const days = clamp(req.query.days, 1, 90, 7)
  const storeId = req.user.store_id

  const startMs = Date.now() - 6 * 3600_000 - (days - 1) * 86400_000
  const start = utc6DateStr(startMs)
  const end = utc6DateStr(Date.now())

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const dayMap = {}
  for (let i = 0; i < days; i++) {
    const key = utc6DateStr(startMs + i * 86400_000)
    dayMap[key] = { dia: dayNames[new Date(key + 'T00:00:00Z').getUTCDay()], ventas: 0, ganancia: 0 }
  }

  const salesRows = db.prepare(`
    select date(created_at, '-6 hours') as day, sum(total) as ventas
    from sales where store_id = ? and date(created_at, '-6 hours') between ? and ?
    group by day
  `).all(storeId, start, end)

  const gainRows = db.prepare(`
    select date(s.created_at, '-6 hours') as day,
           sum(si.qty * (si.precio - coalesce(p.precio_compra, 0))) as ganancia
    from sale_items si
    join sales s on s.id = si.venta_id
    left join products p on p.id = si.producto_id
    where s.store_id = ? and date(s.created_at, '-6 hours') between ? and ?
    group by day
  `).all(storeId, start, end)

  for (const v of salesRows) if (dayMap[v.day]) dayMap[v.day].ventas = Number(v.ventas)
  for (const v of gainRows) if (dayMap[v.day]) dayMap[v.day].ganancia = Number(v.ganancia)

  res.json(Object.entries(dayMap).map(([, vals]) => ({
    dia: vals.dia,
    ventas: round2(vals.ventas),
    ganancia: round2(vals.ganancia),
  })))
})

router.get('/top-products', (req, res) => {
  const limit = clamp(req.query.limit, 1, 20, 5)
  const storeId = req.user.store_id
  const range = parseRange(req)

  let sql = `
    select si.producto_id,
           coalesce(p.nombre, si.nombre) as nombre,
           sum(si.qty) as ventas,
           sum(si.subtotal) as ingresos,
           round(avg(case when p.precio_venta > 0
             then (p.precio_venta - p.precio_compra) / p.precio_venta * 100
             else 0 end), 1) as margen
    from sale_items si
    join sales s on s.id = si.venta_id
    left join products p on p.id = si.producto_id
    where s.store_id = ?
  `
  const params = [storeId]
  if (hasRange(range)) {
    sql += " and date(s.created_at, '-6 hours') between ? and ?"
    params.push(range.start, range.end)
  }
  sql += ' group by si.producto_id, coalesce(p.nombre, si.nombre) order by ingresos desc limit ?'
  params.push(limit)

  res.json(db.prepare(sql).all(...params).map(r => ({
    nombre: r.nombre,
    ventas: Number(r.ventas) || 0,
    ingresos: Number(r.ingresos) || 0,
    margen: r.margen || 0,
  })))
})

router.get('/summary', (req, res) => {
  const range = parseRange(req)
  if (!hasRange(range)) return res.status(400).json({ error: 'Se requieren start y end' })
  const storeId = req.user.store_id

  const salesRow = db.prepare(`
    select count(*) as count, coalesce(sum(total), 0) as ventas
    from sales where store_id = ? and date(created_at, '-6 hours') between ? and ?
  `).get(storeId, range.start, range.end)

  const gainRow = db.prepare(`
    select coalesce(sum(si.qty * (si.precio - coalesce(p.precio_compra, 0))), 0) as ganancia
    from sale_items si
    join sales s on s.id = si.venta_id
    left join products p on p.id = si.producto_id
    where s.store_id = ? and date(s.created_at, '-6 hours') between ? and ?
  `).get(storeId, range.start, range.end)

  const ventas = Number(salesRow.ventas) || 0
  const transacciones = Number(salesRow.count) || 0
  const ganancia = Number(gainRow.ganancia) || 0

  res.json({
    ventas: round2(ventas),
    transacciones,
    ganancia: round2(ganancia),
    margen: ventas > 0 ? round2((ganancia / ventas) * 100) : 0,
    ticketPromedio: transacciones > 0 ? round2(ventas / transacciones) : 0,
  })
})

router.get('/categories', (req, res) => {
  const range = parseRange(req)
  if (!hasRange(range)) return res.status(400).json({ error: 'Se requieren start y end' })
  const storeId = req.user.store_id

  const rows = db.prepare(`
    select coalesce(p.categoria, 'Sin categoría') as name, sum(si.subtotal) as value
    from sale_items si
    join sales s on s.id = si.venta_id
    left join products p on p.id = si.producto_id
    where s.store_id = ? and date(s.created_at, '-6 hours') between ? and ?
    group by name order by value desc
  `).all(storeId, range.start, range.end)

  res.json(rows.map((r, i) => ({
    name: r.name,
    value: round2(Number(r.value) || 0),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  })))
})

router.get('/monthly', (req, res) => {
  const months = clamp(req.query.months, 1, 24, 6)
  const storeId = req.user.store_id

  const nowU = new Date(Date.now() - 6 * 3600_000)
  const monthMap = {}
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(nowU.getUTCFullYear(), nowU.getUTCMonth() - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    monthMap[key] = { ventas: 0, ganancia: 0 }
  }

  const salesRows = db.prepare(`
    select strftime('%Y-%m', created_at, '-6 hours') as ym, sum(total) as ventas
    from sales where store_id = ? group by ym
  `).all(storeId)

  const gainRows = db.prepare(`
    select strftime('%Y-%m', s.created_at, '-6 hours') as ym,
           sum(si.qty * (si.precio - coalesce(p.precio_compra, 0))) as ganancia
    from sale_items si
    join sales s on s.id = si.venta_id
    left join products p on p.id = si.producto_id
    where s.store_id = ? group by ym
  `).all(storeId)

  for (const v of salesRows) if (monthMap[v.ym]) monthMap[v.ym].ventas = Number(v.ventas)
  for (const v of gainRows) if (monthMap[v.ym]) monthMap[v.ym].ganancia = Number(v.ganancia)

  res.json(Object.entries(monthMap).map(([ym, vals]) => ({
    mes: `${MONTH_LABELS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`,
    ventas: round2(vals.ventas),
    ganancia: round2(vals.ganancia),
  })))
})

router.get('/cash-flow', (req, res) => {
  const range = parseRange(req)
  if (!hasRange(range)) return res.status(400).json({ error: 'Se requieren start y end' })
  const storeId = req.user.store_id

  const salesRow = db.prepare(`
    select coalesce(sum(monto_pagado), 0) as ingresos, coalesce(sum(iva), 0) as iva
    from sales where store_id = ? and date(created_at, '-6 hours') between ? and ?
  `).get(storeId, range.start, range.end)

  const costRow = db.prepare(`
    select coalesce(sum(si.qty * coalesce(p.precio_compra, 0)), 0) as costo
    from sale_items si
    join sales s on s.id = si.venta_id
    left join products p on p.id = si.producto_id
    where s.store_id = ? and date(s.created_at, '-6 hours') between ? and ?
  `).get(storeId, range.start, range.end)

  const ingresos = Number(salesRow.ingresos) || 0
  const iva = Number(salesRow.iva) || 0
  const costoVendido = Number(costRow.costo) || 0

  res.json({
    ingresos: round2(ingresos),
    iva: round2(iva),
    costoVendido: round2(costoVendido),
    flujoNeto: round2(ingresos - costoVendido - iva),
  })
})

router.get('/totals', (req, res) => {
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ error: 'Se requieren start y end' })

  const row = db.prepare(`
    select count(*) as count, coalesce(sum(total), 0) as total
    from sales where store_id = ? and date(created_at, '-6 hours') between ? and ?
  `).get(req.user.store_id, start, end)

  res.json({ total: row.total, count: row.count })
})

export default router