import { Router } from 'express'
import db from '../db.js'

const router = Router()
const IVA_RATE = 0.16

function round2(n) {
  return Math.round(n * 100) / 100
}

function saleToDTO(row) {
  const items = db.prepare('select * from sale_items where venta_id = ? order by id').all(row.id).map(it => ({
    id: it.id,
    venta_id: it.venta_id,
    producto_id: it.producto_id,
    nombre: it.nombre,
    precio: it.precio,
    qty: it.qty,
    subtotal: it.subtotal,
  }))

  return {
    id: row.id,
    folio: row.folio.startsWith('#') ? row.folio : `#${row.folio}`,
    cliente: row.cliente,
    total: row.total,
    metodo_pago: row.metodo_pago,
    items,
    created_at: row.created_at,
  }
}

router.get('/', (req, res) => {
  const { today, recent, start, end, limit } = req.query
  let sql = 'select * from sales where store_id = ?'
  const params = [req.user.store_id]

  if (today === 'true' || today === '1') {
    sql += " and date(created_at) = date('now')"
  }
  if (start && end) {
    sql += ' and date(created_at) >= date(?) and date(created_at) <= date(?)'
    params.push(start, end)
  }

  sql += ' order by created_at desc, id desc'
  if (recent === 'true' || recent === '1') {
    sql += ' limit ?'
    params.push(Math.max(Number(limit) || 5, 1))
  }

  res.json(db.prepare(sql).all(...params).map(saleToDTO))
})

router.get('/daily-totals', (req, res) => {
  const rows = db.prepare(`
    select * from sales where store_id = ? and date(created_at) = date('now')
  `).all(req.user.store_id)
  const total = rows.reduce((s, v) => s + Number(v.total), 0)
  res.json({ total, count: rows.length, promedio: rows.length > 0 ? total / rows.length : 0 })
})

router.post('/', (req, res) => {
  const b = req.body || {}
  const items = Array.isArray(b.items) ? b.items : []
  if (items.length === 0) return res.status(400).json({ error: 'El carrito está vacío' })

  const metodoPago = b.metodo_pago
  if (!['efectivo', 'transferencia', 'terminal'].includes(metodoPago)) {
    return res.status(400).json({ error: 'Método de pago inválido' })
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.precio) || 0) * (Number(it.qty) || 0), 0)
  const iva = round2(subtotal * IVA_RATE)
  const total = round2(subtotal + iva)

  const maxRow = db.prepare('select max(id) as m from sales where store_id = ?').get(req.user.store_id)
  const folio = `V-${String((maxRow?.m || 0) + 1).padStart(4, '0')}`

  const result = db.prepare(`
    insert into sales (folio, cliente, subtotal, iva, total, metodo_pago, user_id, store_id)
    values (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(folio, b.cliente || 'Cliente general', subtotal, iva, total, metodoPago, req.user.id, req.user.store_id)

  const ventaId = result.lastInsertRowid

  for (const it of items) {
    const qty = Number(it.qty) || 0
    const precio = Number(it.precio) || 0
    const itemSubtotal = round2(precio * qty)

    db.prepare(`
      insert into sale_items (venta_id, producto_id, nombre, precio, qty, subtotal)
      values (?, ?, ?, ?, ?, ?)
    `).run(ventaId, it.id ?? null, it.nombre || 'Producto', precio, qty, itemSubtotal)

    if (it.id) {
      db.prepare(`
        update products set existencia = max(0, existencia - ?) where id = ? and store_id = ?
      `).run(qty, it.id, req.user.store_id)
    }

    db.prepare(`
      insert into inventory_movements (producto_id, tipo, cantidad, motivo, referencia, user_id, store_id)
      values (?, 'salida', ?, ?, ?, ?, ?)
    `).run(it.id ?? null, qty, `Venta ${folio}`, folio, req.user.id, req.user.store_id)
  }

  const sale = db.prepare('select * from sales where id = ?').get(ventaId)
  res.status(201).json(saleToDTO(sale))
})

export default router