import { LayoutDashboard, ShoppingCart, Package, BarChart3, Bot, Settings, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const APP_NAME = 'RetailOS'
export const APP_VERSION = '2.4'
export const DEFAULT_STORE_NAME = 'Abarrotes El Roble'
export const DEFAULT_STORE_ADDRESS = 'Calle Principal 45, Col. Centro, CDMX 06000'

export const CATEGORIES = ['Todos', 'Bebidas', 'Lácteos', 'Botanas', 'Abarrotes', 'Panadería', 'Limpieza']

export const NAV_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'reports', label: 'Reportes', icon: BarChart3 },
  { id: 'ai', label: 'Asistente IA', icon: Bot },
  { id: 'settings', label: 'Configuración', icon: Settings },
  { id: 'help', label: 'Ayuda', icon: HelpCircle },
]

export const IVA_RATE = 0.16
export const TAX_NAME = 'IVA 16%'
