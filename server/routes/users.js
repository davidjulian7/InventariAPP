import { Router } from 'express'
import db, { hashPassword } from '../db.js'

const router = Router()

function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' })
  }
  next()
}

function userDTO(u) {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol,
    store_id: u.store_id,
    active: !!u.active,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }
}

const VALID_ROLES = ['admin', 'cajero', 'almacenista', 'gerente']

router.use(requireAdmin)

router.get('/', (req, res) => {
  const rows = db.prepare('select * from users where store_id = ? order by active desc, nombre collate nocase')
    .all(req.user.store_id)
  res.json(rows.map(userDTO))
})

router.post('/', (req, res) => {
  const b = req.body || {}
  const email = String(b.email || '').toLowerCase().trim()
  const password = String(b.password || '')
  const nombre = String(b.nombre || '').trim()
  const rol = VALID_ROLES.includes(b.rol) ? b.rol : 'cajero'

  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const existing = db.prepare('select id from users where email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'El correo ya está registrado' })

  const result = db.prepare(`
    insert into users (email, password_hash, nombre, rol, store_id)
    values (?, ?, ?, ?, ?)
  `).run(email, hashPassword(password), nombre, rol, req.user.store_id)

  res.status(201).json(userDTO(db.prepare('select * from users where id = ?').get(result.lastInsertRowid)))
})

router.put('/:id', (req, res) => {
  const b = req.body || {}
  const row = db.prepare('select * from users where id = ? and store_id = ?')
    .get(Number(req.params.id), req.user.store_id)
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' })

  const upd = {}
  if (b.nombre !== undefined) upd.nombre = String(b.nombre)
  if (b.email !== undefined) upd.email = String(b.email).toLowerCase().trim()
  if (b.rol !== undefined && VALID_ROLES.includes(b.rol)) upd.rol = b.rol
  if (b.active !== undefined) upd.active = b.active ? 1 : 0

  if (row.id === req.user.id && upd.active === 0) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' })
  }

  const keys = Object.keys(upd)
  if (keys.length > 0) {
    db.prepare(`update users set ${keys.map(k => `${k} = ?`).join(', ')} where id = ?`)
      .run(...keys.map(k => upd[k]), row.id)
  }

  res.json(userDTO(db.prepare('select * from users where id = ?').get(row.id)))
})

router.put('/:id/password', (req, res) => {
  const row = db.prepare('select * from users where id = ? and store_id = ?')
    .get(Number(req.params.id), req.user.store_id)
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' })

  const password = String(req.body?.password || '')
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }
  db.prepare('update users set password_hash = ? where id = ?')
    .run(hashPassword(password), row.id)
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  const row = db.prepare('select * from users where id = ? and store_id = ?')
    .get(Number(req.params.id), req.user.store_id)
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' })
  if (row.id === req.user.id) return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' })

  db.prepare('update users set active = 0 where id = ?').run(row.id)
  res.json({ ok: true })
})

export default router