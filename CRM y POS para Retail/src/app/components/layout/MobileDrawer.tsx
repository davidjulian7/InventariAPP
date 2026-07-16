import { ShoppingBag, LogOut, X, Bot } from 'lucide-react'
import { NAV_ITEMS, APP_NAME, DEFAULT_STORE_NAME } from '../../lib/constants'

export function MobileDrawer({ isOpen, onClose, activeModule, setActiveModule, onLogout }: {
  isOpen: boolean; onClose: () => void; activeModule: string; setActiveModule: (m: string) => void; onLogout: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-72 bg-foreground h-full flex flex-col shadow-2xl">
        <div className="px-5 py-6 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center"><ShoppingBag size={17} className="text-white" /></div>
            <div><div className="text-white font-bold text-sm">{APP_NAME}</div><div className="text-white/35 text-xs">{DEFAULT_STORE_NAME}</div></div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center cursor-pointer"><X size={17} className="text-white/60" /></button>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeModule === item.id
            return (
              <button key={item.id} onClick={() => { setActiveModule(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium cursor-pointer text-left min-h-[52px] transition-colors ${isActive ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/8'}`}>
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.id === 'ai' && <span className="bg-accent text-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">IA</span>}
              </button>
            )
          })}
        </nav>
        <div className="px-3 pb-6 border-t border-white/8 pt-3">
          <div className="bg-white/6 rounded-xl px-3 py-2.5 mb-2">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-secondary rounded-full" /><span className="text-white/60 text-xs">Negocio abierto</span></div>
            <div className="text-white text-sm font-bold mt-0.5">$12,450 hoy</div>
          </div>
          <button onClick={() => { onLogout(); onClose() }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/45 hover:text-white hover:bg-white/8 text-sm cursor-pointer min-h-[44px] transition-colors">
            <LogOut size={17} />Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
