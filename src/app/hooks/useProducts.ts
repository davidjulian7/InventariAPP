import { useState, useEffect, useCallback } from 'react'
import type { Product, Movement } from '../types'
import { ProductService } from '../services/product.service'

export function useProducts(storeId: number) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ProductService.getAll(storeId)
      setProducts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const getByBarcode = useCallback(async (codigo: string): Promise<Product | null> => {
    return ProductService.getByBarcode(codigo, storeId)
  }, [storeId])

  const search = useCallback(async (query: string): Promise<Product[]> => {
    return ProductService.search(query, storeId)
  }, [storeId])

  const createProduct = useCallback(async (product: Partial<Product>) => {
    const created = await ProductService.create({ ...product, store_id: storeId })
    setProducts(prev => [...prev, created])
    return created
  }, [storeId])

  const updateProduct = useCallback(async (id: number, updates: Partial<Product>) => {
    await ProductService.update(id, updates)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const deleteProduct = useCallback(async (id: number) => {
    await ProductService.delete(id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const getMovements = useCallback(async (productId: number): Promise<Movement[]> => {
    return ProductService.getMovements(productId)
  }, [])

  return {
    products,
    loading,
    error,
    getByBarcode,
    search,
    createProduct,
    updateProduct,
    deleteProduct,
    getMovements,
    refresh: loadProducts,
  }
}
