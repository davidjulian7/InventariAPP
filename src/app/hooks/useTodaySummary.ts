import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SaleService } from '../services/sale.service'

/** Total de ventas de hoy para la tienda del usuario actual (usado en Sidebar/MobileDrawer/Dashboard). */
export function useTodaySummary() {
  const { user } = useAuth()
  const storeId = user?.store_id ?? 1
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    SaleService.getDailyTotals(storeId)
      .then(data => { if (active) setTotal(data.total) })
      .catch(() => { if (active) setTotal(null) })
    return () => { active = false }
  }, [storeId])

  return total
}
