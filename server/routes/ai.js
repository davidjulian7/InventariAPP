import { Router } from 'express'
import db from '../db.js'

const router = Router()

const PLAN_LIMITS = { gratis: 10, basico: 50, pro: 200, premium: 1000 }
const PLAN_LABELS = { gratis: 'Gratis', basico: 'Básico', pro: 'Pro', premium: 'Premium' }

function planKey(plan) {
  const p = String(plan || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (p.includes('gratis')) return 'gratis'
  if (p.includes('bas')) return 'basico'
  if (p.includes('premium')) return 'premium'
  if (p.includes('pro')) return 'pro'
  return 'basico'
}

function usageState(storeId) {
  const s = db.prepare('select * from store_settings where store_id = ?').get(storeId) || {}
  const today = new Date().toISOString().slice(0, 10)
  const key = planKey(s.billing_plan)
  const used = s.ai_usage_date === today ? Number(s.ai_usage_count) || 0 : 0
  return { key, limit: PLAN_LIMITS[key], label: PLAN_LABELS[key], used, today }
}

router.get('/usage', (req, res) => {
  const { key, limit, label, used } = usageState(req.user.store_id)
  res.json({
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan: key,
    planLabel: label,
  })
})

router.post('/usage', (req, res) => {
  const { key, limit, label, used, today } = usageState(req.user.store_id)
  if (used >= limit) {
    return res.json({ ok: false, reason: 'limit', used, limit, remaining: 0, plan: key, planLabel: label })
  }
  db.prepare('update store_settings set ai_usage_date = ?, ai_usage_count = ? where store_id = ?')
    .run(today, used + 1, req.user.store_id)
  res.json({
    ok: true,
    used: used + 1,
    limit,
    remaining: limit - (used + 1),
    plan: key,
    planLabel: label,
  })
})

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