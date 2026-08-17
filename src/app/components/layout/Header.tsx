import { useState } from 'react'
import { useLocation } from 'react-router'
import { Search, X, Menu, ShoppingBag, ChevronDown } from 'lucide-react'
import { NAV_ITEMS } from '../../lib/constants'
import { NotificationsBell } from './NotificationsDropdown'

const moduleTitles: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map(n => [n.id, n.label])
)

export function Header({ isMobile, onMenuOpen }: { isMobile: boolean; onMenuOpen: () => void }) {
  const location = useLocation()
  const activeModule = location.pathname.slice(1) || 'dashboard'
  const [showSearch, setShowSearch] = useState(false)

  if (isMobile) {
    return (
      <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30">
        {showSearch ? (
          <>
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus placeholder="Buscar..." className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]" />
            </div>
            <button onClick={() => setShowSearch(false)} className="w-9 h-9 flex items-center justify-center text-muted-foreground cursor-pointer"><X size={18} /></button>
          </>
        ) : (
          <>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center"><ShoppingBag size={14} className="text-white" /></div>
              <h1 className="text-sm font-bold text-foreground">{moduleTitles[activeModule]}</h1>
            </div>
            <button onClick={() => setShowSearch(true)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground cursor-pointer min-w-[36px]"><Search size={17} /></button>
            <NotificationsBell mobile />
            <button onClick={onMenuOpen} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center cursor-pointer min-w-[36px]"><Menu size={18} className="text-foreground" /></button>
          </>
        )}
      </header>
    )
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1"><h1 className="text-base font-bold text-foreground">{moduleTitles[activeModule]}</h1></div>
      <div className="relative w-64">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input placeholder="Buscar productos, ventas..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
      </div>
      <div className="flex items-center gap-2">
        <NotificationsBell />
        <div className="flex items-center gap-2.5 pl-3 border-l border-border ml-1 cursor-pointer">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm"><span className="text-white text-xs font-bold">JR</span></div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-foreground leading-tight">Juan Reyes</div>
            <div className="text-xs text-muted-foreground">Administrador</div>
          </div>
          <ChevronDown size={13} className="text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
