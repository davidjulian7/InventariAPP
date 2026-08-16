import { useNavigate, useLocation } from 'react-router'
import { NAV_ITEMS } from '../../lib/constants'

const bottomNavItems = NAV_ITEMS.slice(0, 5)

export function BottomNav({ cartCount = 0 }: { cartCount?: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeModule = location.pathname.slice(1) || 'dashboard'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="flex items-center">
        {bottomNavItems.map(item => {
          const Icon = item.icon
          const isActive = activeModule === item.id
          return (
            <button key={item.id} onClick={() => navigate('/' + item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[64px] relative cursor-pointer transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.id === 'pos' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount > 9 ? '9+' : cartCount}</span>
                )}
              </div>
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
