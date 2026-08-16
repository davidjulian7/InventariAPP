import { Router } from 'express'
import db from '../db.js'
import { productDTO } from '../helpers.js'

const router = Router()

router.get('/', (req, res) => {
  const { search, categoria, lowStock } = req.query
  let sql = 'select * from products where store_id = ? and active = 1'
  const params = [req.user.store_id]

  if (search) {
    sql += ' and (nombre like ? or codigo_barras like ? or sku like ?)'
    const like = `%${String(search)}%`
    params.push(like, like, like)
  }
  if (categoria) {
    sql += ' and categoria = ?'
    params.push(categoria)
  }
  if (lowStock === 'true' || lowStock === '1') {
    sql += ' and existencia <= stock_min'
  }
  sql += ' order by nombre collate nocase'

  res.json(db.prepare(sql).all(...params).map(productDTO))
})

router.post('/', (req, res) => {
  const b = req.body || {}
  const result = db.prepare(`
    insert into products (sku, codigo_barras, nombre, categoria, category_id, precio_compra, precio_venta, existencia, stock_min, proveedor_id, store_id)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.sku ?? null,
    b.codigo_barras ?? null,
    b.nombre || 'Producto',
    b.categoria ?? null,
    b.category_id ?? null,
    Number(b.precio_compra) || 0,
    Number(b.precio_venta) || 0,
    Number(b.existencia) || 0,
    Number(b.stock_min) || 10,
    b.proveedor_id ?? null,
    req.user.store_id,
  )

  const row = db.prepare('select * from products where id = ?').get(result.lastInsertRowid)
  res.status(201).json(productDTO(row))
})

router.get('/barcode/:codigo', (req, res) => {
  const row = db.prepare(`
    select * from products where store_id = ? and codigo_barras = ? and active = 1
  `).get(req.user.store_id, req.params.codigo)
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json(productDTO(row))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('select * from products where id = ? and store_id = ?').get(Number(req.params.id), req.user.store_id)
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json(productDTO(row))
})

router.put('/:id', (req, res) => {
  const b = req.body || {}
  const row = db.prepare('select * from products where id = ? and store_id = ?').get(Number(req.params.id), req.user.store_id)
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' })

  const upd = {}
  if (b.sku !== undefined) upd.sku = b.sku
  if (b.codigo_barras !== undefined) upd.codigo_barras = b.codigo_barras
  if (b.nombre !== undefined) upd.nombre = b.nombre
  if (b.categoria !== undefined) upd.categoria = b.categoria
  if (b.category_id !== undefined) upd.category_id = b.category_id
  if (b.precio_compra !== undefined) upd.precio_compra = Number(b.precio_compra)
  if (b.precio_venta !== undefined) upd.precio_venta = Number(b.precio_venta)
  if (b.existencia !== undefined) upd.existencia = Number(b.existencia)
  if (b.stock_min !== undefined) upd.stock_min = Number(b.stock_min)
  if (b.proveedor_id !== undefined) upd.proveedor_id = b.proveedor_id

  const keys = Object.keys(upd)
  if (keys.length > 0) {
    db.prepare(`update products set ${keys.map(k => `${k} = ?`).join(', ')} where id = ?`)
      .run(...keys.map(k => upd[k]), row.id)
  }

  res.json(productDTO(db.prepare('select * from products where id = ?').get(row.id)))
})

router.delete('/:id', (req, res) => {
  const result = db.prepare('update products set active = 0 where id = ? and store_id = ?')
    .run(Number(req.params.id), req.user.store_id)
  if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json({ ok: true })
})

router.get('/:id/movements', (req, res) => {
  const rows = db.prepare(`
    select * from inventory_movements where producto_id = ? order by created_at desc, id desc
  `).all(Number(req.params.id))
  res.json(rows)
})

router.post('/:id/movements', (req, res) => {
  const b = req.body || {}
  const result = db.prepare(`
    insert into inventory_movements (producto_id, tipo, cantidad, motivo, referencia, user_id, store_id)
    values (?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(req.params.id),
    b.tipo || 'ajuste',
    Number(b.cantidad) || 0,
    b.motivo ?? null,
    b.referencia ?? null,
    req.user.id,
    b.store_id ?? req.user.store_id,
  )
  const row = db.prepare('select * from inventory_movements where id = ?').get(result.lastInsertRowid)
  res.status(201).json(row)
})

export default router