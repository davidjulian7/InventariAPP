const DB_PREFIX = 'inventari_'

function getTable<T>(name: string): T[] {
  try {
    const raw = localStorage.getItem(DB_PREFIX + name)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTable<T>(name: string, data: T[]): void {
  localStorage.setItem(DB_PREFIX + name, JSON.stringify(data))
}

function nextId(table: string): number {
  const rows = getTable(table)
  return rows.length > 0 ? Math.max(...rows.map((r: any) => r.id)) + 1 : 1
}

export const localDb = {
  getAll<T>(table: string): T[] {
    return getTable<T>(table)
  },

  getById<T extends { id: number }>(table: string, id: number): T | null {
    const rows = getTable<T>(table)
    return rows.find(r => r.id === id) || null
  },

  insert<T extends { id: number }>(table: string, data: any): T {
    const rows = getTable<T>(table)
    const id = nextId(table)
    const now = new Date().toISOString()
    const row = { ...data, id, created_at: now, updated_at: now }
    rows.push(row)
    saveTable(table, rows)
    return row
  },

  update<T extends { id: number }>(table: string, id: number, data: Partial<T>): T {
    const rows = getTable<any>(table)
    const idx = rows.findIndex(r => r.id === id)
    if (idx === -1) throw new Error(`Row ${id} not found in ${table}`)
    rows[idx] = { ...rows[idx], ...data, updated_at: new Date().toISOString() }
    saveTable(table, rows)
    return rows[idx]
  },

  remove(table: string, id: number): void {
    const rows = getTable(table)
    saveTable(table, rows.filter(r => r.id !== id))
  },

  query<T>(table: string, fn: (item: T) => boolean): T[] {
    return getTable<T>(table).filter(fn)
  },

  count(table: string): number {
    return getTable(table).length
  },

  search<T extends Record<string, any>>(table: string, field: string, value: string): T[] {
    return getTable<T>(table).filter(r =>
      String(r[field]).toLowerCase().includes(value.toLowerCase())
    )
  },

  orderBy<T>(table: string, field: string, dir: 'asc' | 'desc' = 'asc'): T[] {
    const rows = getTable<T>(table)
    return [...rows].sort((a, b) => {
      const av = (a as any)[field], bv = (b as any)[field]
      if (av < bv) return dir === 'asc' ? -1 : 1
      if (av > bv) return dir === 'asc' ? 1 : -1
      return 0
    })
  },
}

function isSeeded(): boolean {
  return localStorage.getItem(DB_PREFIX + '_seeded') === '1'
}

export function seedLocalDb() {
  if (isSeeded()) return

  const now = new Date().toISOString()

  /* ---- usuarios ---- */
  const usuarios = [
    { id: 1, usuario: 'jreyes', nombre_completo: 'Juan Reyes', correo: 'admin@elroble.mx', contraseña: 'admin123', rol: 'admin', created_at: now, updated_at: now },
  ]
  saveTable('usuarios', usuarios)

  /* ---- tienda ---- */
  const tiendas = [
    { id: 1, nombre: 'Abarrotes El Roble', calle: 'Calle Principal', numero: '45', codigo_postal: '06000', colonia: 'Col. Centro', ciudad: 'CDMX', telefono: '55-1234-5678', horario_apertura: '07:00', horario_cierre: '22:00', acepta_tarjeta: true, fecha_registro: now, usuario_id: 1, created_at: now, updated_at: now },
  ]
  saveTable('tienda', tiendas)

  /* ---- producto ---- */
  const productos = [
    { id: 1, nombre: 'Coca-Cola 600ml', marca: 'Coca-Cola', categoria: 'Bebidas', unidad_medida: 'pieza', codigo_barras: '7501055300231', descripcion: '', activo: true, created_at: now, updated_at: now },
    { id: 2, nombre: 'Leche Lala 1L', marca: 'Lala', categoria: 'Lácteos', unidad_medida: 'pieza', codigo_barras: '7500478000014', descripcion: '', activo: true, created_at: now, updated_at: now },
    { id: 3, nombre: 'Sabritas Original 45g', marca: 'Sabritas', categoria: 'Botanas', unidad_medida: 'pieza', codigo_barras: '7501011008084', descripcion: '', activo: true, created_at: now, updated_at: now },
    { id: 4, nombre: 'Agua Ciel 600ml', marca: 'Ciel', categoria: 'Bebidas', unidad_medida: 'pieza', codigo_barras: '7501055328037', descripcion: '', activo: true, created_at: now, updated_at: now },
    { id: 5, nombre: 'Arroz La Merced 1kg', marca: 'La Merced', categoria: 'Abarrotes', unidad_medida: 'pieza', codigo_barras: '7500462010012', descripcion: '', activo: true, created_at: now, updated_at: now },
    { id: 6, nombre: 'Queso Oaxaca 400g', marca: 'Lala', categoria: 'Lácteos', unidad_medida: 'pieza', codigo_barras: '7501023011014', descripcion: '', activo: true, created_at: now, updated_at: now },
    { id: 7, nombre: 'Detergente Ariel 1kg', marca: 'Ariel', categoria: 'Limpieza', unidad_medida: 'pieza', codigo_barras: '7501031305059', descripcion: '', activo: true, created_at: now, updated_at: now },
    { id: 8, nombre: 'Jugo del Valle 1L', marca: 'Del Valle', categoria: 'Bebidas', unidad_medida: 'pieza', codigo_barras: '7501003020024', descripcion: '', activo: true, created_at: now, updated_at: now },
  ]
  saveTable('producto', productos)

  /* ---- inventario ---- */
  const inventarios = [
    { id: 1, cantidad: 48, stock_minimo: 20, precio_compra: 12.50, precio_venta: 20.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 1, created_at: now, updated_at: now },
    { id: 2, cantidad: 12, stock_minimo: 15, precio_compra: 19.00, precio_venta: 24.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 2, created_at: now, updated_at: now },
    { id: 3, cantidad: 0, stock_minimo: 10, precio_compra: 10.50, precio_venta: 15.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 3, created_at: now, updated_at: now },
    { id: 4, cantidad: 72, stock_minimo: 30, precio_compra: 9.00, precio_venta: 12.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 4, created_at: now, updated_at: now },
    { id: 5, cantidad: 8, stock_minimo: 12, precio_compra: 22.00, precio_venta: 30.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 5, created_at: now, updated_at: now },
    { id: 6, cantidad: 15, stock_minimo: 10, precio_compra: 45.00, precio_venta: 65.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 6, created_at: now, updated_at: now },
    { id: 7, cantidad: 3, stock_minimo: 8, precio_compra: 55.00, precio_venta: 75.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 7, created_at: now, updated_at: now },
    { id: 8, cantidad: 34, stock_minimo: 20, precio_compra: 18.00, precio_venta: 25.00, fecha_actualizacion: now, tienda_id: 1, producto_id: 8, created_at: now, updated_at: now },
  ]
  saveTable('inventario', inventarios)

  /* ---- venta ---- */
  const ventas = [
    { id: 1, fecha: now, total: 127.50, metodo_pago: 'efectivo', tienda_id: 1, created_at: now, updated_at: now },
    { id: 2, fecha: now, total: 345.00, metodo_pago: 'transferencia', tienda_id: 1, created_at: now, updated_at: now },
    { id: 3, fecha: now, total: 89.00, metodo_pago: 'efectivo', tienda_id: 1, created_at: now, updated_at: now },
    { id: 4, fecha: now, total: 1240.00, metodo_pago: 'terminal', tienda_id: 1, created_at: now, updated_at: now },
    { id: 5, fecha: now, total: 56.50, metodo_pago: 'efectivo', tienda_id: 1, created_at: now, updated_at: now },
  ]
  saveTable('venta', ventas)

  /* ---- venta_detalle ---- */
  const ventaDetalles = [
    { id: 1, cantidad: 3, precio_unitario: 20.00, subtotal: 60.00, venta_id: 1, producto_id: 1, created_at: now, updated_at: now },
    { id: 2, cantidad: 2, precio_unitario: 12.00, subtotal: 24.00, venta_id: 1, producto_id: 4, created_at: now, updated_at: now },
    { id: 3, cantidad: 5, precio_unitario: 24.00, subtotal: 120.00, venta_id: 2, producto_id: 2, created_at: now, updated_at: now },
    { id: 4, cantidad: 2, precio_unitario: 65.00, subtotal: 130.00, venta_id: 2, producto_id: 6, created_at: now, updated_at: now },
  ]
  saveTable('venta_detalle', ventaDetalles)

  /* ---- proveedor ---- */
  const proveedores = [
    { id: 1, nombre: 'Coca-Cola FEMSA', telefono: '55-1111-2222', email: 'carlos@cocacola.com', direccion: 'Av. Industriales 100, CDMX', contacto: 'Carlos López', created_at: now, updated_at: now },
    { id: 2, nombre: 'Grupo Lala', telefono: '55-3333-4444', email: 'ana@lala.mx', direccion: 'Blvd. Norte 200, CDMX', contacto: 'Ana Pérez', created_at: now, updated_at: now },
    { id: 3, nombre: 'Bimbo S.A.', telefono: '55-5555-6666', email: 'pedro@bimbo.com', direccion: 'Calz. Vallejo 300, CDMX', contacto: 'Pedro García', created_at: now, updated_at: now },
  ]
  saveTable('proveedor', proveedores)

  /* ---- proveedor_producto ---- */
  const proveedorProductos = [
    { proveedor_id: 1, producto_id: 1 },
    { proveedor_id: 1, producto_id: 4 },
    { proveedor_id: 1, producto_id: 8 },
    { proveedor_id: 2, producto_id: 2 },
    { proveedor_id: 2, producto_id: 6 },
    { proveedor_id: 3, producto_id: 5 },
    { proveedor_id: 3, producto_id: 7 },
  ]
  saveTable('proveedor_producto', proveedorProductos)

  /* ---- compra ---- */
  const compras = [
    { id: 1, fecha: now, total: 1250.00, numero_factura: 'FAC-001', metodo_pago: 'transferencia', proveedor_id: 1, tienda_id: 1, created_at: now, updated_at: now },
  ]
  saveTable('compra', compras)

  /* ---- compra_detalle ---- */
  const compraDetalles = [
    { id: 1, cantidad: 50, precio_compra: 12.50, subtotal: 625.00, compra_id: 1, producto_id: 1 },
    { id: 2, cantidad: 30, precio_compra: 9.00, subtotal: 270.00, compra_id: 1, producto_id: 4 },
  ]
  saveTable('compra_detalle', compraDetalles)

  /* ---- inventory_movements (legacy) ---- */
  const movements = [
    { id: 1, producto_id: 1, tipo: 'entrada', cantidad: 50, motivo: 'Compra a proveedor', store_id: 1, created_at: now },
    { id: 2, producto_id: 2, tipo: 'salida', cantidad: 5, motivo: 'Venta', store_id: 1, created_at: now },
    { id: 3, producto_id: 3, tipo: 'ajuste', cantidad: -3, motivo: 'Merma', store_id: 1, created_at: now },
  ]
  saveTable('inventory_movements', movements)

  localStorage.setItem(DB_PREFIX + '_seeded', '1')
}

export function clearLocalDb() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(DB_PREFIX))
  keys.forEach(k => localStorage.removeItem(k))
}
