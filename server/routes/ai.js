import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/context', (req, res) => {
  const storeId = req.user.store_id
  const products = db.prepare('select * from products where store_id = ? and active = 1').all(storeId)
  const lowStock = products.filter(p => p.existencia < p.stock_min)
  const sales = db.prepare('select * from sales where store_id = ?').all(storeId)
  const totalRevenue = sales.reduce((s, v) => s + Number(v.total), 0)

  res.json({
    totalProducts: products.length,
    lowStockCount: lowStock.length,
    totalSalesCount: sales.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    lowStock: lowStock.map(p => ({ nombre: p.nombre, cantidad: p.existencia, stockMin: p.stock_min })),
  })
})

router.get('/restock-suggestions', (req, res) => {
  const storeId = req.user.store_id
  const rows = db.prepare(`
    select * from products where store_id = ? and active = 1 and existencia <= stock_min
  `).all(storeId)

  res.json(rows.map(p => ({
    producto: p.nombre,
    prioridad: p.existencia === 0 ? 'alta' : p.existencia < p.stock_min / 2 ? 'media' : 'baja',
    razon: `Stock actual: ${p.existencia} / Mínimo: ${p.stock_min}`,
  })))
})

router.get('/chats', (req, res) => {
  const chats = db.prepare('select * from ai_chats where user_id = ? order by updated_at desc, id desc').all(req.user.id)
  res.json(chats.map(chat => ({
    ...chat,
    messages: db.prepare('select * from ai_messages where chat_id = ? order by id').all(chat.id),
  })))
})

router.post('/chats', (req, res) => {
  const b = req.body || {}
  const result = db.prepare('insert into ai_chats (title, user_id, store_id) values (?, ?, ?)')
    .run(b.title || 'Chat', req.user.id, req.user.store_id)
  const chatId = result.lastInsertRowid

  const messages = Array.isArray(b.messages) ? b.messages : []
  for (const m of messages) {
    db.prepare('insert into ai_messages (chat_id, role, content) values (?, ?, ?)')
      .run(chatId, m.role === 'user' ? 'user' : 'assistant', String(m.content || ''))
  }

  const chat = db.prepare('select * from ai_chats where id = ?').get(chatId)
  res.status(201).json({
    ...chat,
    messages: db.prepare('select * from ai_messages where chat_id = ? order by id').all(chatId),
  })
})

export default router