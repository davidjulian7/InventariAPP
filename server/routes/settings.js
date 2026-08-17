import { Router } from 'express'
import db from '../db.js'

const router = Router()

const DEFAULT_SETTINGS = {
  ai_api_key: '',
  ai_model: 'gemini-1.5-flash',
  ai_temperature: 0.7,
  ai_system_prompt: 'Eres un asistente experto en retail y abarrotes que ayuda a dueños de tiendas a gestionar su negocio. Hablas español. Sé conciso, práctico y directo.',
  ticket_encabezado: 'ABARROTES EL ROBLE\nCalle Principal 45, CDMX',
  ticket_pie: 'Gracias por su compra',
  ticket_mostrar_iva: 1,
  notif_stock_bajo: 1,
  notif_resumen_diario: 1,
  notif_agotados: 0,
  notif_ia: 1,
  billing_plan: 'Básico',
  billing_ciclo: 'mensual',
  billing_email: '',
  billing_tarjeta: '',
  billing_proxima_cobro: '',
}

function getStore(storeId) {
  return db.prepare('select * from stores where id = ?').get(storeId)
}

function getSettings(storeId) {
  const row = db.prepare('select * from store_settings where store_id = ?').get(storeId)
  return { ...DEFAULT_SETTINGS, ...(row || {}) }
}

router.get('/', (req, res) => {
  res.json({ store: getStore(req.user.store_id), settings: getSettings(req.user.store_id) })
})

router.put('/store', (req, res) => {
  const b = req.body || {}
  const upd = {}
  const allowed = ['nombre', 'rfc', 'direccion', 'telefono', 'email', 'web', 'logo_url']
  for (const key of allowed) {
    if (b[key] !== undefined) upd[key] = b[key]
  }
  const keys = Object.keys(upd)
  if (keys.length > 0) {
    db.prepare(`update stores set ${keys.map(k => `${k} = ?`).join(', ')} where id = ?`)
      .run(...keys.map(k => upd[k]), req.user.store_id)
  }
  res.json({ store: getStore(req.user.store_id) })
})

function updateSettings(req, res, prefix, allowed) {
  const b = req.body || {}
  const upd = {}
  for (const key of allowed) {
    if (b[key] !== undefined) upd[`${prefix}_${key}`] = b[key]
  }
  const keys = Object.keys(upd)
  if (keys.length > 0) {
    db.prepare(`update store_settings set ${keys.map(k => `${k} = ?`).join(', ')} where store_id = ?`)
      .run(...keys.map(k => upd[k]), req.user.store_id)
  }
  res.json({ settings: getSettings(req.user.store_id) })
}

router.put('/ai', (req, res) => {
  updateSettings(req, res, 'ai', ['api_key', 'model', 'temperature', 'system_prompt'])
})

router.put('/tickets', (req, res) => {
  updateSettings(req, res, 'ticket', ['encabezado', 'pie', 'mostrar_iva'])
})

router.put('/notifications', (req, res) => {
  updateSettings(req, res, 'notif', ['stock_bajo', 'resumen_diario', 'agotados', 'ia'])
})

router.put('/billing', (req, res) => {
  updateSettings(req, res, 'billing', ['plan', 'ciclo', 'email', 'tarjeta', 'proxima_cobro'])
})

const VALID_PLANS = ['gratis', 'basico', 'pro', 'premium']

router.post('/billing/checkout', (req, res) => {
  const b = req.body || {}
  const plan = String(b.plan || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (!VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: 'Plan no válido' })
  }
  const ciclo = b.ciclo === 'anual' ? 'anual' : 'mensual'
  const email = String(b.email || '').trim()
  const last4 = String(b.card_last4 || '').replace(/\D/g, '').slice(-4)
  const tarjeta = last4 ? `•••• ${last4}` : ''

  // El cargo se procesa por un proveedor de pagos certificado (ej. Stripe).
  // Aquí solo guardamos datos no sensibles: el plan y los últimos 4 dígitos.
  const upd = { billing_plan: plan, billing_ciclo: ciclo }
  if (email) upd.billing_email = email
  if (tarjeta) upd.billing_tarjeta = tarjeta
  upd.billing_proxima_cobro = db.prepare(`
    select date('now', 'start of month', '+1 month') as d
  `).get().d

  db.prepare(`update store_settings set ${Object.keys(upd).map(k => `${k} = ?`).join(', ')} where store_id = ?`)
    .run(...Object.values(upd), req.user.store_id)

  res.json({ ok: true, settings: getSettings(req.user.store_id) })
})

export default router