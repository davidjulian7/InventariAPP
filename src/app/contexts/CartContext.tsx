import { createContext, useContext, useState, type ReactNode } from 'react'
import type { CartItem } from '../types'
import { IVA_RATE } from '../lib/constants'

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: { id: number; codigo: string; nombre: string; precio: number; categoria: string }) => void
  updateQty: (id: number, qty: number) => void
  removeItem: (id: number) => void
  clearCart: () => void
  subtotal: number
  iva: number
  total: number
  totalItems: number
  isEmpty: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (product: { id: number; codigo: string; nombre: string; precio: number; categoria: string }) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id))
    } else {
      setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
    }
  }

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const clearCart = () => setCart([])

  const subtotal = cart.reduce((s, i) => s + i.precio * i.qty, 0)
  const iva = subtotal * IVA_RATE
  const total = subtotal + iva
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateQty, removeItem, clearCart,
      subtotal, iva, total, totalItems,
      isEmpty: cart.length === 0,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
