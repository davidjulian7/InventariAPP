import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  DollarSign, TrendingUp, BarChart3, Zap, ShoppingBasket, AlertTriangle, Tag,
  Sparkles, CheckCircle, Star, RefreshCw,
} from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useAuth } from '../../contexts/AuthContext'
import { KPICard } from '../../components/shared/KPICard'
import { Btn } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { ReportService } from '../../services/report.service'
import { SaleService } from '../../services/sale.service'
import { ProductService } from '../../services/product.service'
import { AIService } from '../../services/ai.service'
import { getPeriodRange, getPreviousPeriodRange, formatUTC6Time } from '../../lib/dates'
import { formatCurrency } from '../../lib/utils'
import type { ReportSummary, SalesChartData, CategoryData, TopProduct, Sale } from '../../types'

type ChartPeriod = '7D' | '30D' | '90D'
const CHART_DAYS: Record<ChartPeriod, number> = { '7D': 7, '30D': 30, '90D': 90 }

interface AIInsight { titulo: string; desc: string; tipo: string }

const AI_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  alert: { icon: AlertTriangle, color: 'text-amber-400' },
  star: { icon: Star, color: 'text-accent' },
  trending_up: { icon: TrendingUp, color: 'text-secondary' },
  zap: { icon: Zap, color: 'text-accent' },
}
const DEFAULT_AI_ICON = { icon: Sparkles, color: 'text-accent' }

interface DashboardData {
  today: ReportSummary
  yesterday: ReportSummary
  week: ReportSummary
  prevWeek: ReportSummary
  month: ReportSummary
  prevMonth: ReportSummary
  productsSoldToday: number
  lowStockCount: number
  categories: CategoryData[]
  topProducts: TopProduct[]
  recentSales: Sale[]
}

function trendPct(cur: number, prev: number): number | undefined {
  if (prev <= 0) return undefined
  return Math.round(((cur - prev) / prev) * 1000) / 10
}

export function DashboardScreen() {
  const { isMobile, isTablet } = useBreakpoint()
  const { user } = useAuth()
  const navigate = useNavigate()
  const storeId = user?.store_id ?? 1

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7D')
  const [chartData, setChartData] = useState<SalesChartData[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [insights, setInsights] = useState<AIInsight[] | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  const kpi1 = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'
  const kpi2 = isMobile ? 'grid-cols-1' : 'grid-cols-3'
  const chartGrid = isMobile || isTablet ? 'grid-cols-1' : 'grid-cols-3'
  const bottomGrid = isMobile ? 'grid-cols-1' : 'grid-cols-2'
  const aiGrid = isMobile ? 'grid-cols-1' : 'grid-cols-3'

  const loadDashboard = useCallback(async () => {
    const today = getPeriodRange('dia')
    const yesterday = getPreviousPeriodRange('dia')
    const week = getPeriodRange('semana')
    const prevWeek = getPreviousPeriodRange('semana')
    const month = getPeriodRange('mes')
    const prevMonth = getPreviousPeriodRange('mes')

    setLoading(true)
    setError(false)
    try {
      const [
        todaySummary, yesterdaySummary, weekSummary, prevWeekSummary, monthSummary, prevMonthSummary,
        todaySales, lowStock, categories, topProducts, recentSales,
      ] = await Promise.all([
        ReportService.getSummary(storeId, today.start, today.end),
        ReportService.getSummary(storeId, yesterday.start, yesterday.end),
        ReportService.getSummary(storeId, week.start, week.end),
        ReportService.getSummary(storeId, prevWeek.start, prevWeek.end),
        ReportService.getSummary(storeId, month.start, month.end),
        ReportService.getSummary(storeId, prevMonth.start, prevMonth.end),
        SaleService.getTodaySales(storeId),
        ProductService.getLowStock(storeId),
        ReportService.getCategories(storeId, month.start, month.end),
        ReportService.getTopProducts(storeId, 5, month.start, month.end),
        SaleService.getRecent(storeId, 5),
      ])

      setData({
        today: todaySummary,
        yesterday: yesterdaySummary,
        week: weekSummary,
        prevWeek: prevWeekSummary,
        month: monthSummary,
        prevMonth: prevMonthSummary,
        productsSoldToday: todaySales.reduce((s, sale) => s + sale.items.reduce((si, it) => si + Number(it.qty), 0), 0),
        lowStockCount: lowStock.length,
        categories,
        topProducts,
        recentSales,
      })
    } catch {
      setError(true)
      toast.error('Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  const loadChart = useCallback(async (period: ChartPeriod) => {
    setChartLoading(true)
    try {
      const rows = await ReportService.getSalesChartData(storeId, CHART_DAYS[period])
      setChartData(rows)
    } catch {
      toast.error('Error al cargar la gráfica de ventas')
    } finally {
      setChartLoading(false)
    }
  }, [storeId])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => { loadChart(chartPeriod) }, [chartPeriod, loadChart])

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true)
    try {
      const result = await AIService.getInsights(storeId)
      setInsights(result)
    } catch {
      toast.error('No se pudieron generar las recomendaciones')
      setInsights([])
    } finally {
      setInsightsLoading(false)
    }
  }, [storeId])

  if (loading && !data) {
    return (
      <div className="space-y-4 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-56 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56 bg-muted rounded-2xl animate-pulse" />
          <div className="h-56 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground mb-4">No se pudo cargar el dashboard</p>
        <button onClick={loadDashboard} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer min-h-[44px]">
          <RefreshCw size={15} />Reintentar
        </button>
      </div>
    )
  }

  if (!data) return null

  const maxVentas = Math.max(...data.topProducts.map(p => Number(p.ventas)), 1)
  const tooltipStyle = { borderRadius: '12px', border: '1px solid rgba(27,33,26,0.1)', fontSize: '11px' }

  return (
    <div className="space-y-4 pb-6">
      <div className={`grid ${kpi1} gap-3`}>
        <KPICard title="Ventas de hoy" value={formatCurrency(data.today.ventas)} subtitle={`${data.today.transacciones} transacciones`} icon={DollarSign} trend={trendPct(data.today.ventas, data.yesterday.ventas)} compact={isMobile} />
        <KPICard title="Ventas semana" value={formatCurrency(data.week.ventas)} subtitle={`vs ${formatCurrency(data.prevWeek.ventas)} anterior`} icon={TrendingUp} trend={trendPct(data.week.ventas, data.prevWeek.ventas)} compact={isMobile} />
        <KPICard title="Ventas del mes" value={formatCurrency(data.month.ventas)} subtitle={`vs ${formatCurrency(data.prevMonth.ventas)} anterior`} icon={BarChart3} trend={trendPct(data.month.ventas, data.prevMonth.ventas)} compact={isMobile} />
        <KPICard title="Ganancia neta" value={formatCurrency(data.month.ganancia)} subtitle={`Margen ${data.month.margen.toFixed(1)}%`} icon={Zap} trend={trendPct(data.month.ganancia, data.prevMonth.ganancia)} accentColor compact={isMobile} />
      </div>
      <div className={`grid ${kpi2} gap-3`}>
        <KPICard title="Productos vendidos" value={String(data.productsSoldToday)} subtitle="Hoy" icon={ShoppingBasket} compact={isMobile} />
        <KPICard title="Stock bajo" value={`${data.lowStockCount} producto${data.lowStockCount === 1 ? '' : 's'}`} icon={AlertTriangle} compact={isMobile} onClick={() => navigate('/inventory')} />
        <KPICard title="Ticket promedio" value={formatCurrency(data.today.ticketPromedio)} icon={Tag} trend={trendPct(data.today.ticketPromedio, data.yesterday.ticketPromedio)} compact={isMobile} />
      </div>

      <div className={`grid ${chartGrid} gap-4`}>
        <div className={`bg-card rounded-2xl p-4 border border-border/50 shadow-sm ${!isMobile && !isTablet ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold text-foreground text-sm">Ventas y ganancias</h3><p className="text-xs text-muted-foreground">Tendencia por periodo</p></div>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(['7D', '30D', '90D'] as ChartPeriod[]).map(p => (
                <button key={p} onClick={() => setChartPeriod(p)} className={`px-2.5 py-1.5 text-xs rounded-lg font-medium cursor-pointer ${p === chartPeriod ? 'bg-primary text-white' : 'text-muted-foreground'}`}>{p}</button>
              ))}
            </div>
          </div>
          {chartLoading ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Cargando...</div>
          ) : chartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Sin ventas en el periodo</div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#628141" stopOpacity={0.25} /><stop offset="95%" stopColor="#628141" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EBD5AB" stopOpacity={0.4} /><stop offset="95%" stopColor="#EBD5AB" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,33,26,0.06)" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="ventas" stroke="#628141" strokeWidth={2.5} fill="url(#gV)" name="Ventas" />
                <Area type="monotone" dataKey="ganancia" stroke="#C4A87A" strokeWidth={2} fill="url(#gG)" name="Ganancia" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-1">Categorías</h3>
          <p className="text-xs text-muted-foreground mb-3">Ventas del mes</p>
          {data.categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-xs">Sin ventas este mes</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={data.categories} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                    {data.categories.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatCurrency(Number(v)), '']} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {data.categories.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
                    <span className="font-bold text-foreground">{formatCurrency(Number(c.value))}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`grid ${bottomGrid} gap-4`}>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-foreground text-sm">Más vendidos</h3><Btn variant="ghost" size="sm" onClick={() => navigate('/inventory')}>Ver todos</Btn></div>
          {data.topProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Sin ventas este mes</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{p.nombre}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(Number(p.ventas) / maxVentas) * 100}%` }} /></div>
                      <span className="text-xs text-muted-foreground shrink-0">{p.ventas}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-foreground">{formatCurrency(Number(p.ingresos))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-foreground text-sm">Actividad reciente</h3><Btn variant="ghost" size="sm" onClick={() => navigate('/pos')}>Ver todo</Btn></div>
          {data.recentSales.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Aún no hay ventas registradas</p>
          ) : (
            <div className="space-y-2.5">
              {data.recentSales.map(sale => (
                <div key={sale.id} className="flex items-center gap-3 py-0.5">
                  <div className="w-8 h-8 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={14} className="text-green-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">{sale.folio}</div>
                    <div className="text-xs text-muted-foreground">{sale.cliente} · {formatUTC6Time(sale.created_at)}</div>
                  </div>
                  <div className="text-sm font-bold text-foreground">{formatCurrency(Number(sale.total))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-foreground rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" /><h3 className="font-bold text-white text-sm">Recomendaciones IA</h3>
            {insights && <Badge variant="info">{insights.length} {insights.length === 1 ? 'nueva' : 'nuevas'}</Badge>}
          </div>
          <button onClick={loadInsights} disabled={insightsLoading} className="text-xs font-semibold text-accent hover:underline cursor-pointer disabled:opacity-40 min-h-[36px] px-2">
            {insightsLoading ? 'Analizando...' : insights ? 'Actualizar' : 'Generar análisis'}
          </button>
        </div>
        {!insights ? (
          <div className="bg-white/6 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-white/55 text-xs">Genera recomendaciones basadas en tus ventas e inventario actuales.</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white/6 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-white/55 text-xs">Sin recomendaciones por ahora.</p>
          </div>
        ) : (
          <div className={`grid ${aiGrid} gap-3`}>
            {insights.map((r, i) => {
              const { icon: Icon, color } = AI_ICONS[r.tipo] || DEFAULT_AI_ICON
              return (
                <div key={i} onClick={() => navigate('/ai')} className="bg-white/6 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors">
                  <Icon size={16} className={`${color} mb-2`} />
                  <div className="text-white text-sm font-semibold mb-1">{r.titulo}</div>
                  <div className="text-white/55 text-xs leading-relaxed">{r.desc}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
