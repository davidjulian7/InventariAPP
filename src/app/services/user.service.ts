import { apiFetch } from './api'
import type { StoreUser } from '../types'

export class UserService {
  static async getUsers(): Promise<StoreUser[]> {
    return apiFetch<StoreUser[]>('/users')
  }

  static async createUser(data: { nombre: string; email: string; password: string; rol: string }): Promise<StoreUser> {
    return apiFetch<StoreUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async updateUser(id: number, data: Partial<StoreUser>): Promise<StoreUser> {
    return apiFetch<StoreUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async changePassword(id: number, password: string): Promise<void> {
    await apiFetch(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    })
  }

  static async deactivate(id: number): Promise<void> {
    await apiFetch(`/users/${id}`, { method: 'DELETE' })
  }
}