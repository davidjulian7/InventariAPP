import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'inventari.db')

const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA foreign_keys = ON')
db.exec(readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))

ensureSalesColumn(db)
ensureStoresWebColumn(db)
ensureStoreSettings(db)

seedIfEmpty(db)

function ensureSalesColumn(database) {
  const cols = database.prepare('pragma table_info(sales)').all().map(c => c.name)
  if (cols.includes('monto_pagado')) return
  database.exec('alter table sales add column monto_pagado real not null default 0')
  database.exec('update sales set monto_pagado = total')
  console.log('[db] Columna sales.monto_pagado agregada')
}

function ensureStoresWebColumn(database) {
  const cols = database.prepare('pragma table_info(stores)').all().map(c => c.name)
  if (cols.includes('web')) return
  database.exec('alter table stores add column web text')
  console.log('[db] Columna stores.web agregada')
}

function ensureStoreSettings(database) {
  const rows = database.prepare('select id from stores').all()
  const insert = database.prepare(`
    insert or ignore into store_settings (store_id)
    values (?)
  `)
  for (const row of rows) insert.run(row.id)

  const cols = database.prepare('pragma table_info(store_settings)').all().map(c => c.name)
  if (!cols.includes('ai_usage_date')) {
    database.exec('alter table store_settings add column ai_usage_date text')
  }
  if (!cols.includes('ai_usage_count')) {
    database.exec('alter table store_settings add column ai_usage_count integer not null default 0')
  }
}

function seedIfEmpty(database) {
  const { c } = database.prepare('select count(*) as c from users').get()
  if (c > 0) return

  database.exec(readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'))

  const email = 'admin@elroble.mx'
  const password = process.env.DEV_ADMIN_PASSWORD || 'admin123'
  database.prepare(
    'insert into users (email, password_hash, nombre, rol, store_id) values (?, ?, ?, ?, ?)'
  ).run(email, hashPassword(password), 'Juan Reyes', 'admin', 1)

  console.log(`[db] Semilla creada. Usuario admin: ${email} / ${password}`)
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), candidate)
}

export default db
