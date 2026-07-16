import { localDb } from '../lib/db'
import type { User } from '../types'

export class AuthService {
  static async login(email: string, password: string): Promise<User | null> {
    const users = localDb.query<any>('usuarios', (u: any) => u.correo === email && u.contraseña === password)
    if (users.length === 0) return null
    const u = users[0]
    const tiendas = localDb.query<any>('tienda', (t: any) => t.usuario_id === u.id)
    return {
      id: u.id,
      email: u.correo,
      nombre: u.nombre_completo,
      rol: u.rol,
      store_id: tiendas.length > 0 ? tiendas[0].id : 1,
    }
  }

  static async logout(): Promise<void> {
    localStorage.removeItem('inventari_current_user')
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const raw = localStorage.getItem('inventari_current_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  static async register(email: string, password: string, nombre: string): Promise<User | null> {
    const existing = localDb.query<any>('usuarios', (u: any) => u.correo === email)
    if (existing.length > 0) throw new Error('El usuario ya existe')

    const newUser = localDb.insert('usuarios', { usuario: nombre, nombre_completo: nombre, correo: email, contraseña: password, rol: 'admin' })
    return {
      id: newUser.id,
      email: newUser.correo,
      nombre: newUser.nombre_completo,
      rol: newUser.rol,
      store_id: 1,
    }
  }

  static onAuthStateChange(_callback: (user: User | null) => void) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
}
