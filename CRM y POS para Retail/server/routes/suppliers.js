import { Router } from 'express'
import db from '../db.js'
import { supplierDTO } from '../helpers.js'

const router = Router()

router.get('/', (req, res) => {
  const rows = db.prepare('select * from suppliers where store_id = ? order by nombre collate nocase').all(req.user.store_id)
  res.json(rows.map(supplierDTO))
})

router.post('/', (req, res) => {
  const b = req.body || {}
  const result = db.prepare(`
    insert into suppliers (nombre, contacto, telefono, email, direccion, store_id)
    values (?, ?, ?, ?, ?, ?)
  `).run(
    b.nombre || 'Proveedor',
    b.contacto ?? null,
    b.telefono ?? null,
    b.email ?? null,
    b.direccion ?? null,
    req.user.store_id,
  )
  const row = db.prepare('select * from suppliers where id = ?').get(result.lastInsertRowid)
  res.status(201).json(supplierDTO(row))
})

router.put('/:id', (req, res) => {
  const b = req.body || {}
  const row = db.prepare('select * from suppliers where id = ? and store_id = ?').get(Number(req.params.id), req.user.store_id)
  if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' })

  const upd = {}
  if (b.nombre !== undefined) upd.nombre = b.nombre
  if (b.contacto !== undefined) upd.contacto = b.contacto
  if (b.telefono !== undefined) upd.telefono = b.telefono
  if (b.email !== undefined) upd.email = b.email
  if (b.direccion !== undefined) upd.direccion = b.direccion

  const keys = Object.keys(upd)
  if (keys.length > 0) {
    db.prepare(`update suppliers set ${keys.map(k => `${k} = ?`).join(', ')} where id = ?`)
      .run(...keys.map(k => upd[k]), row.id)
  }

  res.json(supplierDTO(db.prepare('select * from suppliers where id = ?').get(row.id)))
})

router.delete('/:id', (req, res) => {
  const result = db.prepare('delete from suppliers where id = ? and store_id = ?').run(Number(req.params.id), req.user.store_id)
  if (result.changes === 0) return res.status(404).json({ error: 'Proveedor no encontrado' })
  res.json({ ok: true })
})

export default router