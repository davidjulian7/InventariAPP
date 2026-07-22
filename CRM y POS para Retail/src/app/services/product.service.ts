import { db } from '../lib/data'
import type { Product, Movement } from '../types'
import { getStockStatus, calculateMargen } from '../lib/utils'

export class ProductService {
  static async getAll(storeId: number): Promise<Product[]> {
    const inventarios = db.query<any>('inventario', (i: any) => i.tienda_id === storeId)
    return inventarios
      .map((inv: any) => this.joinProducto(inv))
      .filter((p: any) => p !== null)
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))
  }

  static async getByBarcode(codigo: string, storeId: number): Promise<Product | null> {
    const prod = db.query<any>('producto', (p: any) => p.codigo_barras === codigo && p.activo !== false)
    if (prod.length === 0) return null
    const invs = db.query<any>('inventario', (i: any) => i.producto_id === prod[0].id && i.tienda_id === storeId)
    if (invs.length === 0) return null
    return this.enrich(this.joinProductoRaw(prod[0], invs[0]))
  }

  static async search(query: string, storeId: number): Promise<Product[]> {
    const q = query.toLowerCase()
    const productos = db.query<any>('producto', (p: any) =>
      p.activo !== false &&
      (p.nombre.toLowerCase().includes(q) || p.codigo_barras.includes(q))
    )
    const prodIds = new Set(productos.map((p: any) => p.id))
    const inventarios = db.query<any>('inventario', (i: any) =>
      i.tienda_id === storeId && prodIds.has(i.producto_id)
    )
    return inventarios
      .map((inv: any) => this.joinProducto(inv))
      .filter((p: any) => p !== null)
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))
  }

  static async create(product: Partial<Product>): Promise<Product> {
    const prod = db.insert('producto', {
      nombre: product.nombre,
      marca: product.sku,
      categoria: product.categoria,
      unidad_medida: 'pieza',
      codigo_barras: product.codigo_barras,
      descripcion: '',
      activo: true,
    })
    const inv = db.insert('inventario', {
      cantidad: product.existencia || 0,
      stock_minimo: product.stock_min || 10,
      precio_compra: product.precio_compra || 0,
      precio_venta: product.precio_venta || 0,
      tienda_id: product.store_id || 1,
      producto_id: prod.id,
    })
    return this.enrich(this.joinProductoRaw(prod, inv))
  }

  static async update(id: number, product: Partial<Product>): Promise<Product> {
    const invs = db.query<any>('inventario', (i: any) => i.producto_id === id)
    if (invs.length > 0) {
      const updates: any = {}
      if (product.precio_compra !== undefined) updates.precio_compra = product.precio_compra
      if (product.precio_venta !== undefined) updates.precio_venta = product.precio_venta
      if (product.existencia !== undefined) updates.cantidad = product.existencia
      if (product.stock_min !== undefined) updates.stock_minimo = product.stock_min
      if (Object.keys(updates).length > 0) {
        db.update('inventario', invs[0].id, updates)
      }
    }
    const prodUpdates: any = {}
    if (product.nombre !== undefined) prodUpdates.nombre = product.nombre
    if (product.categoria !== undefined) prodUpdates.categoria = product.categoria
    if (product.codigo_barras !== undefined) prodUpdates.codigo_barras = product.codigo_barras
    if (Object.keys(prodUpdates).length > 0) {
      db.update('producto', id, prodUpdates)
    }
    const inv2 = db.query<any>('inventario', (i: any) => i.producto_id === id)
    const prod2 = db.getById<any>('producto', id)
    return this.enrich(this.joinProductoRaw(prod2!, inv2[0]))
  }

  static async delete(id: number): Promise<void> {
    db.update('producto', id, { activo: false })
  }

  static async getMovements(productId: number): Promise<Movement[]> {
    const moves = db.query<any>('inventory_movements', (m: any) => m.producto_id === productId)
    return moves.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  static async addMovement(movement: Partial<Movement>): Promise<Movement> {
    return db.insert('inventory_movements', movement)
  }

  static async getLowStock(storeId: number): Promise<Product[]> {
    const inventarios = db.query<any>('inventario', (i: any) =>
      i.tienda_id === storeId && i.cantidad < i.stock_minimo
    )
    return inventarios
      .map((inv: any) => this.joinProducto(inv))
      .filter((p: any) => p !== null)
  }

  static async getByCategory(categoria: string, storeId: number): Promise<Product[]> {
    const prodIds = db.query<any>('producto', (p: any) => p.categoria === categoria && p.activo !== false)
      .map((p: any) => p.id)
    const inventarios = db.query<any>('inventario', (i: any) =>
      i.tienda_id === storeId && prodIds.includes(i.producto_id)
    )
    return inventarios
      .map((inv: any) => this.joinProducto(inv))
      .filter((p: any) => p !== null)
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))
  }

  /* helpers */
  private static joinProducto(inv: any): Product | null {
    const prod = db.getById<any>('producto', inv.producto_id)
    if (!prod || prod.activo === false) return null
    return this.enrich(this.joinProductoRaw(prod, inv))
  }

  private static joinProductoRaw(prod: any, inv: any) {
    const proveedores = db.query<any>('proveedor_producto', (pp: any) => pp.producto_id === prod.id)
    return {
      id: prod.id,
      sku: prod.marca || '',
      codigo_barras: prod.codigo_barras,
      nombre: prod.nombre,
      categoria: prod.categoria || '',
      precio_compra: inv.precio_compra || 0,
      precio_venta: inv.precio_venta || 0,
      existencia: inv.cantidad || 0,
      stock_min: inv.stock_minimo || 10,
      proveedor_id: proveedores.length > 0 ? proveedores[0].proveedor_id : undefined,
    }
  }

  private static enrich(p: any): Product {
    return {
      ...p,
      margen: calculateMargen(p.precio_compra, p.precio_venta),
      estado: getStockStatus(p.existencia, p.stock_min),
    }
  }
}
