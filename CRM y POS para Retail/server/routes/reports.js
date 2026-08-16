import { Router } from 'express'
import db from '../db.js'

const router = Router()

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

router.get('/sales-chart', (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90)
  const storeId = req.user.store_id
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const dayMap = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dayMap[toDateKey(d)] = { ventas: 0, ganancia: 0 }
  }

  const rows = db.prepare(`
    select * from sales where store_id = ? and date(created_at) >= date(?) and date(created_at) <= date(?)
  `).all(storeId, toDateKey(start), toDateKey(end))

  for (const v of rows) {
    const key = String(v.created_at).slice(0, 10)
    if (dayMap[key]) {
      dayMap[key].ventas += Number(v.total)
      dayMap[key].ganancia += Number(v.total) * 0.25
    }
  }

  res.json(Object.entries(dayMap).map(([date, vals]) => ({
    dia: dayNames[new Date(`${date}T00:00:00`).getDay()],
    ventas: Math.round(vals.ventas * 100) / 100,
    ganancia: Math.round(vals.ganancia * 100) / 100,
  })))
})

router.get('/top-products', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20)
  const storeId = req.user.store_id

  const rows = db.prepare(`
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
    group by si.producto_id, coalesce(p.nombre, si.nombre)
    order by ingresos desc
    limit ?
  `).all(storeId, limit)

  res.json(rows.map(r => ({
    nombre: r.nombre,
    ventas: r.ventas,
    ingresos: r.ingresos,
    margen: r.margen || 0,
  })))
})

router.get('/totals', (req, res) => {
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ error: 'Se requieren start y end' })

  const row = db.prepare(`
    select count(*) as count, coalesce(sum(total), 0) as total
    from sales where store_id = ? and date(created_at) >= date(?) and date(created_at) <= date(?)
  `).get(req.user.store_id, start, end)

  res.json({ total: row.total, count: row.count })
})

export default router