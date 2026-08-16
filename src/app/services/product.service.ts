import { apiFetch } from './api'
import type { Product, Movement } from '../types'

export class ProductService {
  static async getAll(storeId: number): Promise<Product[]> {
    return apiFetch<Product[]>(`/products?store_id=${storeId}`)
  }

  static async getByBarcode(codigo: string, storeId: number): Promise<Product | null> {
    try {
      return await apiFetch<Product>(`/products/barcode/${encodeURIComponent(codigo)}`)
    } catch {
      return null
    }
  }

  static async search(query: string, storeId: number): Promise<Product[]> {
    return apiFetch<Product[]>(`/products?search=${encodeURIComponent(query)}`)
  }

  static async create(product: Partial<Product>): Promise<Product> {
    return apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  }

  static async update(id: number, product: Partial<Product>): Promise<Product> {
    return apiFetch<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    })
  }

  static async delete(id: number): Promise<void> {
    await apiFetch(`/products/${id}`, { method: 'DELETE' })
  }

  static async getMovements(productId: number): Promise<Movement[]> {
    return apiFetch<Movement[]>(`/products/${productId}/movements`)
  }

  static async addMovement(movement: Partial<Movement>): Promise<Movement> {
    return apiFetch<Movement>(`/products/${movement.producto_id}/movements`, {
      method: 'POST',
      body: JSON.stringify(movement),
    })
  }

  static async getLowStock(storeId: number): Promise<Product[]> {
    return apiFetch<Product[]>('/products?lowStock=true')
  }

  static async getByCategory(categoria: string, storeId: number): Promise<Product[]> {
    return apiFetch<Product[]>(`/products?categoria=${encodeURIComponent(categoria)}`)
  }
}