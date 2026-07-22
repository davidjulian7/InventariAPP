export interface DataAdapter {
  getAll<T>(table: string): T[]
  getById<T extends { id: number }>(table: string, id: number): T | null
  insert<T>(table: string, data: any): T
  update<T>(table: string, id: number, data: Partial<T>): T
  remove(table: string, id: number): void
  query<T>(table: string, fn: (item: T) => boolean): T[]
  count(table: string): number
  search<T>(table: string, field: string, value: string): T[]
  orderBy<T>(table: string, field: string, dir?: 'asc' | 'desc'): T[]
}

export interface User {
  id: number
  email: string
  nombre: string
  rol: string
  store_id: number
}

export interface Product {
  id: number
  sku: string
  codigo_barras: string
  nombre: string
  categoria: string
  precio_compra: number
  precio_venta: number
  existencia: number
  stock_min: number
  margen: number
  estado: 'ok' | 'bajo' | 'agotado'
  proveedor_id?: number
  created_at?: string
  updated_at?: string
}

export interface CartItem {
  id: number
  codigo: string
  nombre: string
  precio: number
  categoria: string
  qty: number
}

export interface Sale {
  id: number
  folio: string
  cliente: string
  total: number
  metodo_pago: 'efectivo' | 'transferencia' | 'terminal'
  items: SaleItem[]
  created_at: string
}

export interface SaleItem {
  id: number
  venta_id: number
  producto_id: number
  nombre: string
  precio: number
  qty: number
  subtotal: number
}

export interface Supplier {
  id: number
  nombre: string
  contacto: string
  telefono: string
  email: string
  direccion: string
}

export interface Movement {
  id: number
  producto_id: number
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo: string
  created_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SalesChartData {
  dia: string
  ventas: number
  ganancia: number
}

export interface TopProduct {
  nombre: string
  ventas: number
  ingresos: number
  margen: number
}
