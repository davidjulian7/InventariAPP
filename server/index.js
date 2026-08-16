import express from 'express'
import { randomBytes } from 'node:crypto'
import db, { hashPassword, verifyPassword } from './db.js'
import { requireAuth } from './middleware.js'
import productsRouter from './routes/products.js'
import salesRouter from './routes/sales.js'
import reportsRouter from './routes/reports.js'
import suppliersRouter from './routes/suppliers.js'
import aiRouter from './routes/ai.js'

const PORT = process.env.PORT || 4000
const SESSION_DAYS = 30

const app = express()
app.use(express.json())

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    store_id: user.store_id,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: 'sqlite' })
})

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  const password = String(req.body?.password || '')

  const user = db.prepare('select * from users where email = ? and active = 1').get(email)
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales inválidas' })
  }

  const token = randomBytes(32).toString('hex')
  db.prepare(`
    insert into sessions (token, user_id, expires_at)
    values (?, ?, datetime('now', '+${SESSION_DAYS} days'))
  `).run(token, user.id)

  res.json({ token, user: publicUser(user) })
})

app.post('/api/auth/register', (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  const password = String(req.body?.password || '')
  const nombre = String(req.body?.nombre || '').trim()

  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' })
  }

  const existing = db.prepare('select id from users where email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'El usuario ya existe' })

  const store = db.prepare('select id from stores order by id limit 1').get()
  const result = db.prepare(`
    insert into users (email, password_hash, nombre, rol, store_id)
    values (?, ?, ?, 'admin', ?)
  `).run(email, hashPassword(password), nombre, store?.id ?? 1)

  const user = db.prepare('select * from users where id = ?').get(result.lastInsertRowid)

  const token = randomBytes(32).toString('hex')
  db.prepare(`
    insert into sessions (token, user_id, expires_at)
    values (?, ?, datetime('now', '+${SESSION_DAYS} days'))
  `).run(token, user.id)

  res.status(201).json({ token, user: publicUser(user) })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.post('/api/auth/logout', requireAuth, (req, res) => {
  db.prepare('delete from sessions where token = ?').run(req.token)
  res.json({ ok: true })
})

app.use('/api/products', requireAuth, productsRouter)
app.use('/api/sales', requireAuth, salesRouter)
app.use('/api/reports', requireAuth, reportsRouter)
app.use('/api/suppliers', requireAuth, suppliersRouter)
app.use('/api/ai', requireAuth, aiRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

app.listen(PORT, () => {
  console.log(`[api] RetailOS API escuchando en http://localhost:${PORT}`)
})
