export interface Usuario {
  id: number
  usuario: string
  nombre_completo: string
  correo: string
  contraseña: string
  rol: string
}

export interface User {
  id: number
  email: string
  nombre: string
  rol: string
  store_id: number
}

export interface Tienda {
  id: number
  nombre: string
  calle?: string
  numero?: string
  codigo_postal?: string
  colonia?: string
  ciudad?: string
  telefono?: string
  horario_apertura?: string
  horario_cierre?: string
  acepta_tarjeta?: boolean
  fecha_registro?: string
  usuario_id: number
}

export interface Producto {
  id: number
  nombre: string
  marca?: string
  categoria?: string
  unidad_medida?: string
  codigo_barras: string
  descripcion?: string
  activo?: boolean
}

export interface Inventario {
  id: number
  cantidad: number
  stock_minimo: number
  precio_compra: number
  precio_venta: number
  fecha_actualizacion?: string
  tienda_id: number
  producto_id: number
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

export interface Venta {
  id: number
  fecha: string
  total: number
  metodo_pago: string
  tienda_id: number
}

export interface VentaDetalle {
  id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  venta_id: number
  producto_id: number
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

export interface Proveedor {
  id: number
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  contacto?: string
}

export interface Supplier {
  id: number
  nombre: string
  contacto: string
  telefono: string
  email: string
  direccion: string
}

export interface Compra {
  id: number
  fecha: string
  total: number
  numero_factura?: string
  metodo_pago?: string
  proveedor_id: number
  tienda_id: number
}

export interface CompraDetalle {
  id: number
  cantidad: number
  precio_compra: number
  subtotal: number
  compra_id: number
  producto_id: number
}

export interface Movement {
  id: number
  producto_id: number
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo: string
  created_at: string
}

export interface Category {
  id: number
  nombre: string
  color: string
}

export interface Store {
  id: number
  nombre: string
  rfc: string
  direccion: string
  telefono: string
  email: string
  logo_url?: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIInsight {
  titulo: string
  desc: string
  tipo: 'trending_up' | 'alert' | 'star' | 'zap'
}

export interface DashboardKPI {
  title: string
  value: string
  subtitle?: string
  trend?: number
  accentColor?: boolean
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
