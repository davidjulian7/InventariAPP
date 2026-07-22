import { useNavigate, useLocation } from 'react-router'
import { ShoppingBag, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_ITEMS, APP_NAME, DEFAULT_STORE_NAME } from '../../lib/constants'

export function Sidebar({ onLogout, collapsed, onToggleCollapse }: {
  onLogout: () => void; collapsed: boolean; onToggleCollapse: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeModule = location.pathname.slice(1) || 'dashboard'

  return (
    <aside className={`h-screen bg-foreground flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-[228px]'}`}>
      <div className={`border-b border-white/8 flex items-center ${collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5'}`}>
        {collapsed ? (
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center"><ShoppingBag size={17} className="text-white" /></div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm"><ShoppingBag size={17} className="text-white" /></div>
            <div><div className="text-white font-bold text-sm leading-tight">{APP_NAME}</div><div className="text-white/35 text-xs">{DEFAULT_STORE_NAME}</div></div>
          </div>
        )}
      </div>
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = activeModule === item.id
          return (
            <button key={item.id} onClick={() => navigate('/' + item.id)} title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${collapsed ? 'px-0 py-3 justify-center' : 'px-3 py-2.5 text-left'} ${isActive ? 'bg-primary text-white shadow-sm' : 'text-white/55 hover:text-white hover:bg-white/8'}`}>
              <Icon size={17} className="shrink-0" />
              {!collapsed && (<><span className="flex-1">{item.label}</span>{item.id === 'ai' && <span className="bg-accent text-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">IA</span>}</>)}
            </button>
          )
        })}
      </nav>
      <div className={`border-t border-white/8 pt-3 pb-4 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <div className="bg-white/6 rounded-xl px-3 py-2.5 mb-2">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-secondary rounded-full" /><span className="text-white/60 text-xs">Negocio abierto</span></div>
            <div className="text-white text-sm font-bold mt-0.5">$12,450 hoy</div>
          </div>
        )}
        <button onClick={onToggleCollapse} className="w-full flex items-center justify-center py-2 rounded-xl text-white/35 hover:text-white hover:bg-white/8 cursor-pointer min-h-[44px] transition-all">
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        <button onClick={onLogout} className={`w-full flex items-center gap-3 rounded-xl text-white/45 hover:text-white hover:bg-white/8 text-sm cursor-pointer min-h-[44px] transition-all ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`} title={collapsed ? 'Salir' : undefined}>
          <LogOut size={16} />{!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
