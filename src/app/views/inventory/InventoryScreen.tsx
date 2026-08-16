import { useState, useEffect, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Search, Plus, Filter, Package2, Edit2, Trash2, Eye, AlertTriangle, XCircle, Package, RotateCcw, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useAuth } from '../../contexts/AuthContext'
import { useProducts } from '../../hooks/useProducts'
import { Btn } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { formatUTC6Date } from '../../lib/dates'
import type { Product } from '../../types'

const productSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(120, 'Máximo 120 caracteres'),
  sku: z.string().trim().min(1, 'El SKU es requerido').max(50, 'Máximo 50 caracteres'),
  codigo_barras: z.string().trim().max(20, 'Máximo 20 dígitos').regex(/^\d*$/, 'Solo se permiten dígitos'),
  categoria: z.string().trim().min(1, 'La categoría es requerida').max(50, 'Máximo 50 caracteres'),
  precio_compra: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'Debe ser 0 o mayor').max(10000000, 'Valor demasiado grande'),
  precio_venta: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'Debe ser 0 o mayor').max(10000000, 'Valor demasiado grande'),
  existencia: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).int('Debe ser un número entero').min(0, 'Debe ser 0 o mayor').max(10000000, 'Valor demasiado grande'),
  stock_min: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).int('Debe ser un número entero').min(0, 'Debe ser 0 o mayor').max(10000000, 'Valor demasiado grande'),
})

type ProductForm = z.infer<typeof productSchema>
type SortKey = 'recientes' | 'antiguos' | 'nombre_asc' | 'nombre_desc'
type StatusFilter = 'todos' | Product['estado']

const PAGE_SIZES = [5, 10, 15, 25, 50]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ok', label: 'En stock' },
  { value: 'bajo', label: 'Stock bajo' },
  { value: 'agotado', label: 'Agotado' },
]

const SORT_LABELS: Record<SortKey, string> = {
  recientes: 'Más recientes',
  antiguos: 'Más antiguos',
  nombre_asc: 'Nombre A-Z',
  nombre_desc: 'Nombre Z-A',
}

function computeMargen(precioCompra: number, precioVenta: number): number {
  if (precioVenta <= 0) return 0
  return Math.round(((precioVenta - precioCompra) / precioVenta) * 1000) / 10
}

function computeEstado(existencia: number, stockMin: number): Product['estado'] {
  if (existencia <= 0) return 'agotado'
  if (existencia < stockMin) return 'bajo'
  return 'ok'
}

function formatDate(iso?: string): string {
  return formatUTC6Date(iso)
}

function getPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

function Pagination({ page, totalPages, onPageChange, onPrev, onNext, compact = false }: {
  page: number; totalPages: number; onPageChange: (p: number) => void; onPrev: () => void; onNext: () => void; compact?: boolean
}) {
  if (totalPages <= 1) return null
  const btn = 'w-7 h-7 rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center transition-colors min-w-[28px]'
  const pages = getPages(page, totalPages)
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page === 1} className={btn + ' text-muted-foreground hover:bg-muted disabled:opacity-30'} aria-label="Página anterior"><ChevronLeft size={14} /></button>
        <span className="text-xs font-semibold text-muted-foreground px-1">{page} / {totalPages}</span>
        <button onClick={onNext} disabled={page === totalPages} className={btn + ' text-muted-foreground hover:bg-muted disabled:opacity-30'} aria-label="Página siguiente"><ChevronRight size={14} /></button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <button onClick={onPrev} disabled={page === 1} className={btn + ' text-muted-foreground hover:bg-muted disabled:opacity-30'} aria-label="Página anterior"><ChevronLeft size={14} /></button>
      {pages.map((p, i) => p === '…' ? (
        <span key={'e' + i} className="w-7 text-center text-xs text-muted-foreground">…</span>
      ) : (
        <button key={p} onClick={() => onPageChange(p)}
          className={btn + (p === page ? ' bg-primary text-white' : ' text-muted-foreground hover:bg-muted')}>{p}</button>
      ))}
      <button onClick={onNext} disabled={page === totalPages} className={btn + ' text-muted-foreground hover:bg-muted disabled:opacity-30'} aria-label="Página siguiente"><ChevronRight size={14} /></button>
    </div>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-foreground mt-0.5">{value}</div>
    </div>
  )
}

export function InventoryScreen() {
  const { isMobile } = useBreakpoint()
  const { user } = useAuth()
  const { products, loading, error, createProduct, updateProduct, deleteProduct, refresh } = useProducts(user?.store_id ?? 1)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'table' | 'cards'>(isMobile ? 'cards' : 'table')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [viewing, setViewing] = useState<Product | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('Todas')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('todos')
  const [sortBy, setSortBy] = useState<SortKey>('recientes')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { nombre: '', sku: '', codigo_barras: '', categoria: '', precio_compra: 0, precio_venta: 0, existencia: 0, stock_min: 0 },
  })

  const categories = ['Todas', ...new Set(products.map(p => p.categoria).filter(Boolean).sort((a, b) => a.localeCompare(b, 'es')))]

  const activeFilters = (filterCategory !== 'Todas' ? 1 : 0) + (filterStatus !== 'todos' ? 1 : 0)

  useEffect(() => {
    setPage(1)
  }, [search, filterCategory, filterStatus, sortBy, pageSize])

  const filtered = products.filter(p => {
    const s = search.trim().toLowerCase()
    const ms = s === '' ||
      p.nombre.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      p.codigo_barras.toLowerCase().includes(s) ||
      p.categoria.toLowerCase().includes(s)
    const mc = filterCategory === 'Todas' || p.categoria === filterCategory
    const me = filterStatus === 'todos' || p.estado === filterStatus
    return ms && mc && me
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'recientes': return b.id - a.id
      case 'antiguos': return a.id - b.id
      case 'nombre_asc': return a.nombre.localeCompare(b.nombre, 'es')
      case 'nombre_desc': return b.nombre.localeCompare(a.nombre, 'es')
    }
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, sorted.length)

  const bajoCount = products.filter(p => p.estado === 'bajo').length
  const agotadoCount = products.filter(p => p.estado === 'agotado').length
  const okCount = products.filter(p => p.estado === 'ok').length

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      toast.success('Producto eliminado')
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el producto')
    } finally {
      setDeleteTarget(null)
    }
  }

  const openAdd = () => {
    setEditing(null)
    form.reset()
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setViewing(null)
    form.reset({
      nombre: p.nombre,
      sku: p.sku,
      codigo_barras: p.codigo_barras || '',
      categoria: p.categoria,
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      existencia: p.existencia,
      stock_min: p.stock_min,
    })
    setShowModal(true)
  }

  const onSubmitProduct = async (data: ProductForm) => {
    try {
      setSubmitting(true)
      const payload = {
        ...data,
        codigo_barras: data.codigo_barras || '',
        margen: computeMargen(data.precio_compra, data.precio_venta),
        estado: computeEstado(data.existencia, data.stock_min),
      }
      if (editing) {
        await updateProduct(editing.id, payload)
        toast.success('Producto actualizado exitosamente')
      } else {
        await createProduct(payload)
        toast.success('Producto guardado exitosamente')
      }
      form.reset()
      setShowModal(false)
      setEditing(null)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el producto')
    } finally {
      setSubmitting(false)
    }
  }

  const estadoBadge = (e: string) => {
    if (e === 'ok') return <Badge variant="success">En stock</Badge>
    if (e === 'bajo') return <Badge variant="warning">Stock bajo</Badge>
    return <Badge variant="danger">Agotado</Badge>
  }

  const stockColor = (p: Product) => p.existencia === 0 ? 'text-red-500' : p.existencia < p.stock_min ? 'text-amber-600' : 'text-foreground'

  const tableHeaders = ['SKU', 'Producto', 'Categoría', 'P. Compra', 'P. Venta', 'Margen', 'Existencia', 'Estado', 'Acciones']

  const headerCards = [
    { bg: 'bg-amber-50 border-amber-200', ibg: 'bg-amber-100', Icon: AlertTriangle, ic: 'text-amber-600', tc: 'text-amber-700', t: `${bajoCount} con stock bajo`, d: bajoCount === 0 ? 'Sin productos en riesgo' : products.filter(p => p.estado === 'bajo').slice(0, 3).map(p => p.nombre).join(', ') },
    { bg: 'bg-red-50 border-red-200', ibg: 'bg-red-100', Icon: XCircle, ic: 'text-red-600', tc: 'text-red-700', t: `${agotadoCount} ${agotadoCount === 1 ? 'producto agotado' : 'productos agotados'}`, d: agotadoCount === 0 ? 'Inventario completo' : products.filter(p => p.estado === 'agotado').slice(0, 3).map(p => p.nombre).join(', ') },
    { bg: 'bg-green-50 border-green-200', ibg: 'bg-green-100', Icon: Package, ic: 'text-green-600', tc: 'text-green-700', t: `${okCount} con nivel OK`, d: 'Inventario adecuado' },
  ]

  const clearFilters = () => {
    setFilterCategory('Todas')
    setFilterStatus('todos')
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-6">
        <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}</div>
        <div className="h-12 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">No se pudieron cargar los productos</p>
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer min-h-[44px]">
          <RefreshCw size={15} />Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {headerCards.map((a, i) => (
          <div key={i} className={`border rounded-2xl p-4 flex items-center gap-3 ${a.bg}`}>
            <div className={`w-10 h-10 ${a.ibg} rounded-xl flex items-center justify-center shrink-0`}><a.Icon size={18} className={a.ic} /></div>
            <div><div className={`font-bold text-sm ${a.tc}`}>{a.t}</div><div className={`text-xs mt-0.5 ${a.ic} truncate`}>{a.d}</div></div>
          </div>
        ))}
      </div>

      <div className={`flex gap-3 bg-card rounded-2xl border border-border/50 p-4 shadow-sm ${isMobile ? 'flex-wrap' : 'items-center'}`}>
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]" />
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
            className="h-[44px] px-3 pr-8 rounded-xl border border-border bg-muted text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-h-[44px]">
            {Object.entries(SORT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={() => setShowFilters(true)}
            className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted cursor-pointer min-h-[44px]">
            <Filter size={15} />{!isMobile && 'Filtros'}
            {activeFilters > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white rounded-full text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
          {!isMobile && (
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <button onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${view === 'table' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>Tabla</button>
              <button onClick={() => setView('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${view === 'cards' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>Tarjetas</button>
            </div>
          )}
          <Btn variant="primary" size="md" onClick={openAdd}><Plus size={15} />{!isMobile && 'Agregar'}</Btn>
        </div>
      </div>

      {(isMobile || view === 'cards') && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
          {paginated.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border/50 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Package2 size={17} className="text-primary" /></div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setViewing(p)} className="w-8 h-8 rounded-lg bg-muted hover:bg-border flex items-center justify-center cursor-pointer" aria-label="Ver detalles"><Eye size={14} className="text-muted-foreground" /></button>
                  {estadoBadge(p.estado)}
                </div>
              </div>
              <div className="text-sm font-bold text-foreground mb-0.5">{p.nombre}</div>
              <div className="text-xs text-muted-foreground mb-3">{p.sku} - {p.categoria}</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Venta', '$' + p.precio_venta.toFixed(2), 'text-foreground'],
                  ['Margen', p.margen.toFixed(1) + '%', 'text-primary'],
                  ['Stock', p.existencia + ' uds.', stockColor(p)],
                  ['Mínimo', p.stock_min + ' uds.', 'text-foreground']
                ].map(([l, v, c]) => (
                  <div key={l}><div className="text-xs text-muted-foreground">{l}</div><div className={'text-sm font-bold ' + c}>{v}</div></div>
                ))}
              </div>
              {isMobile && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                  <button onClick={() => openEdit(p)} className="flex-1 py-2 bg-muted rounded-xl text-xs font-semibold text-foreground cursor-pointer min-h-[40px] flex items-center justify-center gap-1"><Edit2 size={12} />Editar</button>
                  <button onClick={() => setDeleteTarget(p)} className="flex-1 py-2 bg-red-50 rounded-xl text-xs font-semibold text-red-500 cursor-pointer min-h-[40px] flex items-center justify-center gap-1"><Trash2 size={12} />Eliminar</button>
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
                  {tableHeaders.map(h => (
                    <th key={h}
                      className={'px-4 py-3 text-xs font-bold text-muted-foreground ' + (['P. Compra', 'P. Venta', 'Margen'].includes(h) ? 'text-right' : ['Existencia', 'Estado', 'Acciones'].includes(h) ? 'text-center' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => (
                  <tr key={p.id} className={'border-b border-border/30 hover:bg-muted/40 transition-colors ' + (i % 2 === 1 ? 'bg-muted/10' : '')}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.categoria}</td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">${p.precio_compra.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">${p.precio_venta.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-primary">{p.margen.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={'font-bold text-sm ' + stockColor(p)}>{p.existencia}</span>
                      <span className="text-xs text-muted-foreground">/{p.stock_min}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{estadoBadge(p.estado)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewing(p)} className="w-7 h-7 rounded-lg bg-muted hover:bg-border flex items-center justify-center cursor-pointer" aria-label="Ver detalles"><Eye size={13} className="text-muted-foreground" /></button>
                        <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg bg-muted hover:bg-border flex items-center justify-center cursor-pointer" aria-label="Editar"><Edit2 size={13} className="text-muted-foreground" /></button>
                        <button onClick={() => setDeleteTarget(p)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center cursor-pointer" aria-label="Eliminar"><Trash2 size={13} className="text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Mostrando {rangeStart}-{rangeEnd} de {sorted.length} productos</span>
              <label className="flex items-center gap-1.5">
                <span>Filas:</span>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                  className="h-8 px-2 rounded-lg border border-border bg-muted text-xs font-semibold text-foreground focus:outline-none cursor-pointer">
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <Pagination page={currentPage} totalPages={totalPages}
              onPageChange={p => setPage(p)}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))} />
          </div>
        </div>
      )}

      {(isMobile || view === 'cards') && (
        <div className="flex items-center justify-between gap-3 bg-card rounded-2xl border border-border/50 px-4 py-3 shadow-sm">
          <span className="text-xs text-muted-foreground">Mostrando {rangeStart}-{rangeEnd} de {sorted.length}</span>
          <Pagination page={currentPage} totalPages={totalPages} compact
            onPageChange={p => setPage(p)}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))} />
        </div>
      )}

      {sorted.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-10 bg-card rounded-2xl border border-border/50">
          {products.length === 0 ? 'No hay productos registrados' : 'Sin resultados para la búsqueda o filtros aplicados'}
        </div>
      )}

      <BottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filtros">
        <div className="p-4 space-y-5">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => {
                const active = filterCategory === c
                return (
                  <button key={c} onClick={() => setFilterCategory(c)}
                    className={'px-3 py-2 rounded-xl text-sm font-medium cursor-pointer border min-h-[44px] transition-colors ' + (active ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-muted')}>{c}</button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Estado</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(o => {
                const active = filterStatus === o.value
                return (
                  <button key={o.value} onClick={() => setFilterStatus(o.value)}
                    className={'px-3 py-2 rounded-xl text-sm font-medium cursor-pointer border min-h-[44px] transition-colors ' + (active ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-muted')}>{o.label}</button>
                )
              })}
            </div>
          </div>
          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:underline cursor-pointer">
              <RotateCcw size={13} />Limpiar filtros
            </button>
          )}
          <Btn variant="primary" className="w-full min-h-[52px]" onClick={() => setShowFilters(false)}>Aplicar filtros</Btn>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showModal} onClose={() => { form.reset(); setEditing(null); setShowModal(false) }} title={editing ? 'Editar producto' : 'Agregar producto'} fullHeight>
        <form onSubmit={form.handleSubmit(onSubmitProduct)} className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {([
              { name: 'nombre' as const, label: 'Nombre del producto', placeholder: 'Coca-Cola 600ml', full: true, type: 'text' as const, inputMode: 'text' as const, maxLength: 120 },
              { name: 'sku' as const, label: 'SKU / Código', placeholder: 'BEB-001', full: false, type: 'text' as const, inputMode: 'text' as const, maxLength: 50 },
              { name: 'codigo_barras' as const, label: 'Código de barras', placeholder: '7501055300231', full: false, type: 'text' as const, inputMode: 'numeric' as const, maxLength: 20, pattern: '[0-9]*' },
              { name: 'categoria' as const, label: 'Categoría', placeholder: 'Bebidas', full: false, type: 'text' as const, inputMode: 'text' as const, maxLength: 50, list: 'categorias-list' },
              { name: 'precio_compra' as const, label: 'Precio compra ($)', placeholder: '0.00', full: false, type: 'number' as const, step: '0.01', min: 0 },
              { name: 'precio_venta' as const, label: 'Precio venta ($)', placeholder: '0.00', full: false, type: 'number' as const, step: '0.01', min: 0 },
              { name: 'existencia' as const, label: 'Stock actual', placeholder: '0', full: false, type: 'number' as const, step: 1, min: 0 },
              { name: 'stock_min' as const, label: 'Stock mínimo', placeholder: '10', full: false, type: 'number' as const, step: 1, min: 0 },
            ] as const).map(f => {
              const err = form.formState.errors[f.name]
              return (
                <div key={f.name} className={f.full ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{f.label}</label>
                  <input type={f.type} {...form.register(f.name)}
                    placeholder={f.placeholder}
                    inputMode={f.inputMode}
                    maxLength={f.maxLength}
                    {...('step' in f ? { step: f.step } : {})}
                    {...('min' in f ? { min: f.min } : {})}
                    {...('pattern' in f ? { pattern: f.pattern } : {})}
                    {...('list' in f ? { list: f.list } : {})}
                    className={'w-full px-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px] ' + (err ? 'border-red-300 bg-red-50' : 'border-border bg-muted')} />
                  {err && <p className="text-xs text-red-500 mt-1">{err.message}</p>}
                </div>
              )
            })}
          </div>
          <datalist id="categorias-list">
            {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c} />)}
          </datalist>
          <div className="flex gap-3 mt-5">
            <Btn type="button" variant="outline" onClick={() => { form.reset(); setEditing(null); setShowModal(false) }} className="flex-1 min-h-[52px]">Cancelar</Btn>
            <Btn type="submit" variant="primary" disabled={submitting} className="flex-1 min-h-[52px]">{submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar producto'}</Btn>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet isOpen={viewing !== null} onClose={() => setViewing(null)} title="Detalles del producto" fullHeight>
        {viewing && (
          <div className="p-4">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0"><Package2 size={22} className="text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-foreground leading-snug">{viewing.nombre}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{viewing.sku}</div>
              </div>
              {estadoBadge(viewing.estado)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Código de barras" value={viewing.codigo_barras || '—'} />
              <Field label="Categoría" value={viewing.categoria} />
              <Field label="Precio compra" value={'$' + viewing.precio_compra.toFixed(2)} />
              <Field label="Precio venta" value={'$' + viewing.precio_venta.toFixed(2)} />
              <Field label="Margen" value={<span className="text-primary">{viewing.margen.toFixed(1)}%</span>} />
              <Field label="Estado" value={viewing.estado === 'ok' ? 'En stock' : viewing.estado === 'bajo' ? 'Stock bajo' : 'Agotado'} />
              <Field label="Existencia" value={<span className={stockColor(viewing)}>{viewing.existencia} uds.</span>} />
              <Field label="Stock mínimo" value={viewing.stock_min + ' uds.'} />
              <Field label="Registrado" value={formatDate(viewing.created_at)} />
              <Field label="Última actualización" value={formatDate(viewing.updated_at)} />
            </div>
            <div className="flex gap-3 mt-6">
              <Btn variant="outline" className="flex-1 min-h-[52px]" onClick={() => openEdit(viewing)}><Edit2 size={15} />Editar</Btn>
              <Btn variant="danger" className="flex-1 min-h-[52px]" onClick={() => { setDeleteTarget(viewing); setViewing(null) }}><Trash2 size={15} />Eliminar</Btn>
            </div>
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar producto"
        description={`¿Estás seguro de eliminar "${deleteTarget?.nombre ?? ''}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        destructive
      />
    </div>
  )
}
