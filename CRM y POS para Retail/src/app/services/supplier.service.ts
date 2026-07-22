import { db } from '../lib/data'
import type { Supplier } from '../types'

export class SupplierService {
  static async getAll(storeId: number): Promise<Supplier[]> {
    const proveedores = db.getAll<any>('proveedor')
    return proveedores
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))
      .map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        contacto: p.contacto || '',
        telefono: p.telefono || '',
        email: p.email || '',
        direccion: p.direccion || '',
      }))
  }

  static async create(supplier: Partial<Supplier>): Promise<Supplier> {
    const p = db.insert('proveedor', {
      nombre: supplier.nombre,
      contacto: supplier.contacto,
      telefono: supplier.telefono,
      email: supplier.email,
      direccion: supplier.direccion,
    })
    return {
      id: p.id,
      nombre: p.nombre,
      contacto: p.contacto || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
    }
  }

  static async update(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
    const p = db.update('proveedor', id, {
      nombre: supplier.nombre,
      contacto: supplier.contacto,
      telefono: supplier.telefono,
      email: supplier.email,
      direccion: supplier.direccion,
    })
    return {
      id: p.id,
      nombre: p.nombre,
      contacto: p.contacto || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
    }
  }

  static async delete(id: number): Promise<void> {
    db.remove('proveedor', id)
  }
}
