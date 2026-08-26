import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Search, X, Menu, ShoppingBag, ChevronDown, Package2 } from 'lucide-react'
import { NAV_ITEMS, ROLE_LABELS } from '../../lib/constants'
import { NotificationsBell } from './NotificationsDropdown'
import { useAuth } from '../../contexts/AuthContext'
import { ProductService } from '../../services/product.service'
import { formatCurrency } from '../../lib/utils'
import type { Product } from '../../types'

const moduleTitles: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map(n => [n.id, n.label])
)

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function useProductSearch(storeId: number) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(() => {
      ProductService.search(q, storeId)
        .then(r => setResults(r.slice(0, 6)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query, storeId])

  return { query, setQuery, results, searching, clear: () => { setQuery(''); setResults([]) } }
}

function SearchResults({ results, searching, query, onSelect, onSeeAll }: {
  results: Product[]; searching: boolean; query: string; onSelect: (p: Product) => void; onSeeAll: () => void
}) {
  if (query.trim().length < 2) return null
  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden z-50">
      {searching ? (
        <div className="p-4 text-sm text-muted-foreground text-center">Buscando...</div>
      ) : results.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground text-center">Sin resultados para "{query}"</div>
      ) : (
        <>
          <div className="max-h-72 overflow-y-auto">
            {results.map(p => (
              <button key={p.id} onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer hover:bg-muted/60 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Package2 size={14} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{p.nombre}</div>
                  <div className="text-xs text-muted-foreground">{p.sku} · {p.existencia} en stock</div>
                </div>
                <div className="text-xs font-bold text-foreground shrink-0">{formatCurrency(p.precio_venta)}</div>
              </button>
            ))}
          </div>
          <button onClick={onSeeAll} className="w-full px-4 py-2.5 text-xs font-semibold text-primary text-center border-t border-border/50 cursor-pointer hover:bg-muted/60">
            Ver todos los resultados en Inventario
          </button>
        </>
      )}
    </div>
  )
}

export function Header({ isMobile, onMenuOpen }: { isMobile: boolean; onMenuOpen: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const activeModule = location.pathname.slice(1) || 'dashboard'
  const [showSearch, setShowSearch] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const storeId = user?.store_id ?? 1
  const { query, setQuery, results, searching, clear } = useProductSearch(storeId)

  useEffect(() => {
    if (!showResults) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [showResults])

  const goToInventory = (q: string) => {
    navigate(`/inventory?q=${encodeURIComponent(q)}`)
    setShowResults(false)
    setShowSearch(false)
    clear()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) goToInventory(query.trim())
    if (e.key === 'Escape') { setShowResults(false); setShowSearch(false) }
  }

  if (isMobile) {
    return (
      <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30">
        {showSearch ? (
          <>
            <div className="relative flex-1" ref={wrapRef}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus placeholder="Buscar productos..." value={query}
                onChange={e => { setQuery(e.target.value); setShowResults(true) }}
                onFocus={() => setShowResults(true)} onKeyDown={onKeyDown}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]" />
              {showResults && <SearchResults results={results} searching={searching} query={query} onSelect={p => goToInventory(p.nombre)} onSeeAll={() => goToInventory(query.trim())} />}
            </div>
            <button onClick={() => { setShowSearch(false); clear() }} className="w-9 h-9 flex items-center justify-center text-muted-foreground cursor-pointer"><X size={18} /></button>
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
      <div className="relative w-64" ref={wrapRef}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input placeholder="Buscar productos, ventas..." value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={() => setShowResults(true)} onKeyDown={onKeyDown}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
        {showResults && <SearchResults results={results} searching={searching} query={query} onSelect={p => goToInventory(p.nombre)} onSeeAll={() => goToInventory(query.trim())} />}
      </div>
      <div className="flex items-center gap-2">
        <NotificationsBell />
        <div onClick={() => navigate('/settings')} className="flex items-center gap-2.5 pl-3 border-l border-border ml-1 cursor-pointer">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm"><span className="text-white text-xs font-bold">{getInitials(user?.nombre)}</span></div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-foreground leading-tight">{user?.nombre || 'Usuario'}</div>
            <div className="text-xs text-muted-foreground">{(user?.rol && ROLE_LABELS[user.rol]) || user?.rol || ''}</div>
          </div>
          <ChevronDown size={13} className="text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
