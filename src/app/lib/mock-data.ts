import type { Product, SalesChartData, TopProduct, Sale, Supplier, Movement } from '../types'

export const salesChartData: SalesChartData[] = [
  { dia: 'Lun', ventas: 8420, ganancia: 2100 },
  { dia: 'Mar', ventas: 12340, ganancia: 3085 },
  { dia: 'Mié', ventas: 9870, ganancia: 2468 },
  { dia: 'Jue', ventas: 15200, ganancia: 3800 },
  { dia: 'Vie', ventas: 18900, ganancia: 4725 },
  { dia: 'Sáb', ventas: 22100, ganancia: 5525 },
  { dia: 'Dom', ventas: 14320, ganancia: 3580 },
]

export const monthlyData = [
  { mes: 'Ene', ventas: 280000 },
  { mes: 'Feb', ventas: 310000 },
  { mes: 'Mar', ventas: 295000 },
  { mes: 'Abr', ventas: 342000 },
  { mes: 'May', ventas: 380000 },
  { mes: 'Jun', ventas: 342800 },
]

export const topProducts: TopProduct[] = [
  { nombre: 'Leche Lala 1L', ventas: 342, ingresos: 8208, margen: 18 },
  { nombre: 'Agua Ciel 600ml', ventas: 289, ingresos: 3468, margen: 24 },
  { nombre: 'Coca-Cola 600ml', ventas: 267, ingresos: 5340, margen: 22 },
  { nombre: 'Pan Bimbo', ventas: 198, ingresos: 4356, margen: 20 },
  { nombre: 'Sabritas Original', ventas: 187, ingresos: 2805, margen: 28 },
]

export const categoryData = [
  { name: 'Bebidas', value: 35, color: '#628141' },
  { name: 'Lácteos', value: 22, color: '#8BAE66' },
  { name: 'Botanas', value: 18, color: '#EBD5AB' },
  { name: 'Abarrotes', value: 15, color: '#3D5428' },
  { name: 'Limpieza', value: 10, color: '#C4A87A' },
]

export const inventoryProducts: Product[] = [
  { id: 1, sku: 'BEB-001', codigo_barras: '7501055300231', nombre: 'Coca-Cola 600ml', categoria: 'Bebidas', precio_compra: 12.50, precio_venta: 20.00, existencia: 48, stock_min: 20, margen: 37.5, estado: 'ok' },
  { id: 2, sku: 'LAC-002', codigo_barras: '7500478000014', nombre: 'Leche Lala 1L', categoria: 'Lácteos', precio_compra: 19.00, precio_venta: 24.00, existencia: 12, stock_min: 15, margen: 20.8, estado: 'bajo' },
  { id: 3, sku: 'BOT-003', codigo_barras: '7501011008084', nombre: 'Sabritas Original 45g', categoria: 'Botanas', precio_compra: 10.50, precio_venta: 15.00, existencia: 0, stock_min: 10, margen: 30.0, estado: 'agotado' },
  { id: 4, sku: 'BEB-004', codigo_barras: '7501055328037', nombre: 'Agua Ciel 600ml', categoria: 'Bebidas', precio_compra: 9.00, precio_venta: 12.00, existencia: 72, stock_min: 30, margen: 25.0, estado: 'ok' },
  { id: 5, sku: 'ABR-005', codigo_barras: '7500462010012', nombre: 'Arroz La Merced 1kg', categoria: 'Abarrotes', precio_compra: 22.00, precio_venta: 30.00, existencia: 8, stock_min: 12, margen: 26.7, estado: 'bajo' },
  { id: 6, sku: 'LAC-006', codigo_barras: '7501023011014', nombre: 'Queso Oaxaca 400g', categoria: 'Lácteos', precio_compra: 45.00, precio_venta: 65.00, existencia: 15, stock_min: 10, margen: 30.8, estado: 'ok' },
  { id: 7, sku: 'LIM-007', codigo_barras: '7501031305059', nombre: 'Detergente Ariel 1kg', categoria: 'Limpieza', precio_compra: 55.00, precio_venta: 75.00, existencia: 3, stock_min: 8, margen: 26.7, estado: 'bajo' },
  { id: 8, sku: 'BEB-008', codigo_barras: '7501003020024', nombre: 'Jugo del Valle 1L', categoria: 'Bebidas', precio_compra: 18.00, precio_venta: 25.00, existencia: 34, stock_min: 20, margen: 28.0, estado: 'ok' },
]

export const recentSales: Sale[] = [
  { id: 1, folio: '#V-1047', cliente: 'Cliente general', total: 127.50, metodo_pago: 'efectivo', items: [], created_at: new Date().toISOString() },
  { id: 2, folio: '#V-1046', cliente: 'María González', total: 345.00, metodo_pago: 'transferencia', items: [], created_at: new Date().toISOString() },
  { id: 3, folio: '#V-1045', cliente: 'Cliente general', total: 89.00, metodo_pago: 'efectivo', items: [], created_at: new Date().toISOString() },
  { id: 4, folio: '#V-1044', cliente: 'Restaurante El Sol', total: 1240.00, metodo_pago: 'terminal', items: [], created_at: new Date().toISOString() },
  { id: 5, folio: '#V-1043', cliente: 'Cliente general', total: 56.50, metodo_pago: 'efectivo', items: [], created_at: new Date().toISOString() },
]

export const suppliers: Supplier[] = [
  { id: 1, nombre: 'Coca-Cola FEMSA', contacto: 'Carlos López', telefono: '55-1111-2222', email: 'carlos@coca-cola.com', direccion: 'Av. Industriales 100, CDMX' },
  { id: 2, nombre: 'Grupo Lala', contacto: 'Ana Pérez', telefono: '55-3333-4444', email: 'ana@lala.mx', direccion: 'Blvd. Norte 200, CDMX' },
  { id: 3, nombre: 'Bimbo S.A.', contacto: 'Pedro García', telefono: '55-5555-6666', email: 'pedro@bimbo.com', direccion: 'Calz. Vallejo 300, CDMX' },
]

export const movements: Movement[] = [
  { id: 1, producto_id: 1, tipo: 'entrada', cantidad: 50, motivo: 'Compra a proveedor', created_at: new Date().toISOString() },
  { id: 2, producto_id: 2, tipo: 'salida', cantidad: 5, motivo: 'Venta', created_at: new Date().toISOString() },
  { id: 3, producto_id: 3, tipo: 'ajuste', cantidad: -3, motivo: 'Merma', created_at: new Date().toISOString() },
]
