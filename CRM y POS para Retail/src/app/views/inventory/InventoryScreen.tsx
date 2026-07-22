import { useState } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Filter, Package2, Edit2, Trash2, Eye, AlertTriangle, XCircle, Package, X } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Btn } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { inventoryProducts } from '../../lib/mock-data'

export function InventoryScreen() {
  const { isMobile } = useBreakpoint()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'table' | 'cards'>(isMobile ? 'cards' : 'table')
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = inventoryProducts.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  )

  const estadoBadge = (e: string) => {
    if (e === 'ok') return <Badge variant="success">En stock</Badge>
    if (e === 'bajo') return <Badge variant="warning">Stock bajo</Badge>
    return <Badge variant="danger">Agotado</Badge>
  }

  return (
    <div className="space-y-4 pb-6">
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {[
          { bg: 'bg-amber-50 border-amber-200', ibg: 'bg-amber-100', Icon: AlertTriangle, ic: 'text-amber-600', tc: 'text-amber-700', t: '3 con stock bajo', d: 'Leche, Arroz, Detergente' },
          { bg: 'bg-red-50 border-red-200', ibg: 'bg-red-100', Icon: XCircle, ic: 'text-red-600', tc: 'text-red-700', t: '1 producto agotado', d: 'Sabritas Original 45g' },
          { bg: 'bg-green-50 border-green-200', ibg: 'bg-green-100', Icon: Package, ic: 'text-green-600', tc: 'text-green-700', t: '4 con nivel OK', d: 'Inventario adecuado' },
        ].map((a, i) => (
          <div key={i} className={`border rounded-2xl p-4 flex items-center gap-3 ${a.bg}`}>
            <div className={`w-10 h-10 ${a.ibg} rounded-xl flex items-center justify-center shrink-0`}><a.Icon size={18} className={a.ic} /></div>
            <div><div className={`font-bold text-sm ${a.tc}`}>{a.t}</div><div className={`text-xs mt-0.5 ${a.ic}`}>{a.d}</div></div>
          </div>
        ))}
      </div>

      <div className={`flex gap-3 bg-card rounded-2xl border border-border/50 p-4 shadow-sm ${isMobile ? 'flex-wrap' : 'items-center'}`}>
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]" />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted cursor-pointer min-h-[44px]">
            <Filter size={15} />{!isMobile && 'Filtros'}
          </button>
          {!isMobile && (
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <button onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${view === 'table' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>Tabla</button>
              <button onClick={() => setView('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${view === 'cards' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>Tarjetas</button>
            </div>
          )}
          <Btn variant="primary" size="md" onClick={() => setShowModal(true)}><Plus size={15} />{!isMobile && 'Agregar'}</Btn>
        </div>
      </div>

      {(isMobile || view === 'cards') && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
          {filtered.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border/50 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Package2 size={17} className="text-primary" /></div>
                {estadoBadge(p.estado)}
              </div>
              <div className="text-sm font-bold text-foreground mb-0.5">{p.nombre}</div>
              <div className="text-xs text-muted-foreground mb-3">{p.sku} - {p.categoria}</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Venta', '$' + p.precio_venta.toFixed(2), 'text-foreground'],
                  ['Margen', p.margen.toFixed(1) + '%', 'text-primary'],
                  ['Stock', p.existencia + ' uds.', p.existencia === 0 ? 'text-red-500' : p.existencia < p.stock_min ? 'text-amber-600' : 'text-foreground'],
                  ['Minimo', p.stock_min + ' uds.', 'text-foreground']
                ].map(([l, v, c]) => (
                  <div key={l}><div className="text-xs text-muted-foreground">{l}</div><div className={'text-sm font-bold ' + c}>{v}</div></div>
                ))}
              </div>
              {isMobile && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                  <button className="flex-1 py-2 bg-muted rounded-xl text-xs font-semibold text-foreground cursor-pointer min-h-[40px] flex items-center justify-center gap-1"><Edit2 size={12} />Editar</button>
                  <button className="flex-1 py-2 bg-red-50 rounded-xl text-xs font-semibold text-red-500 cursor-pointer min-h-[40px] flex items-center justify-center gap-1"><Trash2 size={12} />Eliminar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isMobile && view === 'table' && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  {['SKU', 'Producto', 'Categoria', 'P. Compra', 'P. Venta', 'Margen', 'Existencia', 'Estado', 'Acciones'].map(h => (
                    <th key={h}
                      className={'px-4 py-3 text-xs font-bold text-muted-foreground ' + (['P. Compra', 'P. Venta', 'Margen'].includes(h) ? 'text-right' : ['Existencia', 'Estado', 'Acciones'].includes(h) ? 'text-center' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={'border-b border-border/30 hover:bg-muted/40 transition-colors ' + (i % 2 === 1 ? 'bg-muted/10' : '')}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.categoria}</td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">${p.precio_compra.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">${p.precio_venta.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-primary">{p.margen.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={'font-bold text-sm ' + (p.existencia === 0 ? 'text-red-500' : p.existencia < p.stock_min ? 'text-amber-600' : 'text-foreground')}>{p.existencia}</span>
                      <span className="text-xs text-muted-foreground">/{p.stock_min}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{estadoBadge(p.estado)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button className="w-7 h-7 rounded-lg bg-muted hover:bg-border flex items-center justify-center cursor-pointer"><Eye size={13} className="text-muted-foreground" /></button>
                        <button className="w-7 h-7 rounded-lg bg-muted hover:bg-border flex items-center justify-center cursor-pointer"><Edit2 size={13} className="text-muted-foreground" /></button>
                        <button className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center cursor-pointer"><Trash2 size={13} className="text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{filtered.length} productos encontrados</span>
            <div className="flex gap-1">{[1, 2, 3].map(p => (
              <button key={p} className={'w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ' + (p === 1 ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted')}>{p}</button>
            ))}</div>
          </div>
        </div>
      )}

      <BottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filtros">
        <div className="p-4 space-y-5">
          {[
            { label: 'Categoria', opts: ['Todas', 'Bebidas', 'Lacteos', 'Botanas', 'Abarrotes', 'Limpieza'] },
            { label: 'Estado', opts: ['Todos', 'En stock', 'Stock bajo', 'Agotado'] }
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-bold text-foreground mb-2">{f.label}</label>
              <div className="flex flex-wrap gap-2">
                {f.opts.map(o => (
                  <button key={o}
                    className={'px-3 py-2 rounded-xl text-sm font-medium cursor-pointer border min-h-[44px] ' + (o.includes('Tod') ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground')}>{o}</button>
                ))}
              </div>
            </div>
          ))}
          <Btn variant="primary" className="w-full min-h-[52px]" onClick={() => setShowFilters(false)}>Aplicar filtros</Btn>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showModal} onClose={() => setShowModal(false)} title="Agregar producto" fullHeight>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nombre del producto', placeholder: 'Coca-Cola 600ml', full: true },
              { label: 'SKU / Codigo', placeholder: 'BEB-001' },
              { label: 'Codigo de barras', placeholder: '7501055300231' },
              { label: 'Categoria', placeholder: 'Bebidas' },
              { label: 'Precio compra ($)', placeholder: '0.00' },
              { label: 'Precio venta ($)', placeholder: '0.00' },
              { label: 'Stock actual', placeholder: '0' },
              { label: 'Stock minimo', placeholder: '10' }
            ].map(f => (
              <div key={f.label} className={f.full ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{f.label}</label>
                <input placeholder={f.placeholder}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <Btn variant="outline" onClick={() => setShowModal(false)} className="flex-1 min-h-[52px]">Cancelar</Btn>
            <Btn variant="primary" onClick={() => { setShowModal(false); toast.success('Producto guardado exitosamente') }} className="flex-1 min-h-[52px]">Guardar producto</Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
