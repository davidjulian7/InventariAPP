import { apiFetch } from './api'
import type { User } from '../types'

const TOKEN_KEY = 'inventari_token'
const USER_KEY = 'inventari_current_user'

export class AuthService {
  static async login(email: string, password: string): Promise<User | null> {
    const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data.user
  }

  static async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // El servidor puede estar caído; la sesión local se limpia igualmente
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  static async getCurrentUser(): Promise<User | null> {
    if (!localStorage.getItem(TOKEN_KEY)) return null
    try {
      const data = await apiFetch<{ user: User }>('/auth/me')
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      return data.user
    } catch {
      return null
    }
  }

  static async register(email: string, password: string, nombre: string): Promise<User> {
    const data = await apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nombre }),
    })
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data.user
  }

  static onAuthStateChange(_callback: (user: User | null) => void) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
}
