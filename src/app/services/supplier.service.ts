import { apiFetch } from './api'
import type { Supplier } from '../types'

export class SupplierService {
  static async getAll(storeId: number): Promise<Supplier[]> {
    return apiFetch<Supplier[]>('/suppliers')
  }

  static async create(supplier: Partial<Supplier>): Promise<Supplier> {
    return apiFetch<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    })
  }

  static async update(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
    return apiFetch<Supplier>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    })
  }

  static async delete(id: number): Promise<void> {
    await apiFetch(`/suppliers/${id}`, { method: 'DELETE' })
  }
}