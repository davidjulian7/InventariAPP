import { Router } from 'express'
import db from '../db.js'

const router = Router()

function syncAlerts(storeId, userId) {
  const prefs = db.prepare('select * from store_settings where store_id = ?').get(storeId) || {}
  const notifStockBajo = prefs.notif_stock_bajo ?? 1
  const notifAgotados = prefs.notif_agotados ?? 0

  const products = db.prepare('select * from products where store_id = ? and active = 1').all(storeId)
  const lowStock = products.filter(p => p.existencia > 0 && p.existencia <= p.stock_min)
  const outOfStock = products.filter(p => p.existencia <= 0)

  const insert = (title, descripcion, tipo) => {
    const exists = db.prepare(`
      select id from notifications
      where user_id = ? and title = ? and date(created_at) = date('now')
    `).get(userId, title)
    if (exists) return
    db.prepare('insert into notifications (user_id, title, descripcion, tipo) values (?, ?, ?, ?)')
      .run(userId, title, descripcion, tipo)
  }

  if (notifStockBajo) {
    for (const p of lowStock.slice(0, 3)) {
      insert(`Stock bajo: ${p.nombre}`, `Quedan ${p.existencia} uds. (mínimo ${p.stock_min})`, 'stock')
    }
  }
  if (notifAgotados) {
    for (const p of outOfStock.slice(0, 3)) {
      insert(`Agotado: ${p.nombre}`, 'Producto sin existencias, requiere reabastecimiento.', 'stock')
    }
  }
}

router.get('/', (req, res) => {
  syncAlerts(req.user.store_id, req.user.id)
  const rows = db.prepare(`
    select * from notifications where user_id = ? order by leida asc, created_at desc, id desc limit 50
  `).all(req.user.id)
  const unread = db.prepare(`
    select count(*) as c from notifications where user_id = ? and leida = 0
  `).get(req.user.id).c
  res.json({ notifications: rows, unread })
})

router.post('/:id/read', (req, res) => {
  db.prepare('update notifications set leida = 1 where id = ? and user_id = ?')
    .run(Number(req.params.id), req.user.id)
  res.json({ ok: true })
})

router.post('/read-all', (req, res) => {
  db.prepare('update notifications set leida = 1 where user_id = ?').run(req.user.id)
  res.json({ ok: true })
})

export default router