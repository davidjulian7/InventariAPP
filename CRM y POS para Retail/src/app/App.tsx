import { useState } from 'react'
import { useBreakpoint } from './hooks/useBreakpoint'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider, useCart } from './contexts/CartContext'
import { LoginScreen } from './views/auth/LoginScreen'
import { DashboardScreen } from './views/dashboard/DashboardScreen'
import { POSScreen } from './views/pos/POSScreen'
import { InventoryScreen } from './views/inventory/InventoryScreen'
import { ReportsScreen } from './views/reports/ReportsScreen'
import { AIAssistantScreen } from './views/ai/AIAssistantScreen'
import { SettingsScreen } from './views/settings/SettingsScreen'
import { HelpScreen } from './views/help/HelpScreen'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { MobileDrawer } from './components/layout/MobileDrawer'

function AppLayout() {
  const { isMobile } = useBreakpoint()
  const { isAuthenticated, logout } = useAuth()
  const { totalItems } = useCart()
  const [activeModule, setActiveModule] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!isAuthenticated) return <LoginScreen />

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header activeModule={activeModule} isMobile onMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto px-4 pt-3 pb-0">
          {activeModule === 'dashboard' && <DashboardScreen />}
          {activeModule === 'pos' && <POSScreen />}
          {activeModule === 'inventory' && <InventoryScreen />}
          {activeModule === 'reports' && <ReportsScreen />}
          {activeModule === 'ai' && <AIAssistantScreen />}
          {activeModule === 'settings' && <SettingsScreen />}
          {activeModule === 'help' && <HelpScreen />}
        </main>
        <BottomNav activeModule={activeModule} setActiveModule={setActiveModule} cartCount={totalItems} />
        <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
          activeModule={activeModule} setActiveModule={setActiveModule} onLogout={logout} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} onLogout={logout}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header activeModule={activeModule} isMobile={false} onMenuOpen={() => {}} />
        <main className="flex-1 overflow-auto px-5 pt-5">
          {activeModule === 'dashboard' && <DashboardScreen />}
          {activeModule === 'pos' && <POSScreen />}
          {activeModule === 'inventory' && <InventoryScreen />}
          {activeModule === 'reports' && <ReportsScreen />}
          {activeModule === 'ai' && <AIAssistantScreen />}
          {activeModule === 'settings' && <SettingsScreen />}
          {activeModule === 'help' && <HelpScreen />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppLayout />
      </CartProvider>
    </AuthProvider>
  )
}
