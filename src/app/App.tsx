import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router'
import { useBreakpoint } from './hooks/useBreakpoint'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider, useCart } from './contexts/CartContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { MobileDrawer } from './components/layout/MobileDrawer'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { Toaster } from './components/ui/sonner'

const LoginScreen = lazy(() => import('./views/auth/LoginScreen').then(m => ({ default: m.LoginScreen })))
const DashboardScreen = lazy(() => import('./views/dashboard/DashboardScreen').then(m => ({ default: m.DashboardScreen })))
const POSScreen = lazy(() => import('./views/pos/POSScreen').then(m => ({ default: m.POSScreen })))
const InventoryScreen = lazy(() => import('./views/inventory/InventoryScreen').then(m => ({ default: m.InventoryScreen })))
const ReportsScreen = lazy(() => import('./views/reports/ReportsScreen').then(m => ({ default: m.ReportsScreen })))
const AIAssistantScreen = lazy(() => import('./views/ai/AIAssistantScreen').then(m => ({ default: m.AIAssistantScreen })))
const SettingsScreen = lazy(() => import('./views/settings/SettingsScreen').then(m => ({ default: m.SettingsScreen })))
const HelpScreen = lazy(() => import('./views/help/HelpScreen').then(m => ({ default: m.HelpScreen })))
const NotFoundScreen = lazy(() => import('./views/NotFoundScreen').then(m => ({ default: m.NotFoundScreen })))

function AppLayout() {
  const { isMobile } = useBreakpoint()
  const { logout } = useAuth()
  const { totalItems } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header isMobile onMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto px-4 pt-3 pb-[72px]">
          <Suspense fallback={<div className="animate-pulse bg-muted rounded-2xl h-40" />}>
            <Outlet />
          </Suspense>
        </main>
        <BottomNav cartCount={totalItems} />
        <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onLogout={logout} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar onLogout={logout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header isMobile={false} onMenuOpen={() => {}} />
        <main className="flex-1 overflow-auto px-5 pt-5">
          <Suspense fallback={<div className="animate-pulse bg-muted rounded-2xl h-40" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster richColors closeButton />
          <Routes>
            <Route path="/login" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
                <LoginScreen />
              </Suspense>
            } />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardScreen />} />
                <Route path="pos" element={<POSScreen />} />
                <Route path="inventory" element={<InventoryScreen />} />
                <Route path="reports" element={<ReportsScreen />} />
                <Route path="ai" element={<AIAssistantScreen />} />
                <Route path="settings" element={<SettingsScreen />} />
                <Route path="help" element={<HelpScreen />} />
              </Route>
            </Route>
            <Route path="*" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
                <NotFoundScreen />
              </Suspense>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
