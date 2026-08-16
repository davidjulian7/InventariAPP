import db from './db.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  const session = db.prepare(`
    select s.token, s.user_id, s.expires_at,
           u.id, u.email, u.nombre, u.rol, u.store_id
    from sessions s
    join users u on u.id = s.user_id
    where s.token = ? and s.expires_at > datetime('now')
  `).get(token)

  if (!session) return res.status(401).json({ error: 'Sesión inválida o expirada' })

  req.token = token
  req.user = session
  next()
}