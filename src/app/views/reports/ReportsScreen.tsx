import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { DollarSign, TrendingUp, BarChart3, ShoppingCart, Download, Mail, FileSpreadsheet, RefreshCw, PieChart as PieIcon } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useAuth } from '../../contexts/AuthContext'
import { KPICard } from '../../components/shared/KPICard'
import { Btn } from '../../components/shared/Button'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { PdfPreviewModal } from '../../components/shared/PdfPreviewModal'
import { ReportService } from '../../services/report.service'
import { getPeriodRange, getPreviousPeriodRange, REPORT_PERIOD_LABELS, type ReportPeriod } from '../../lib/dates'
import { generateReportsPdf, generateReportsXlsx, buildShareText, reportFilename, type ReportData } from '../../lib/report-export'
import { formatCurrency } from '../../lib/utils'
import type { ReportSummary } from '../../types'

const CATEGORY_COLORS = ['#628141', '#8BAE66', '#EBD5AB', '#3D5428', '#C4A87A', '#7F9B68', '#D9C9A3', '#59793B']

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short' })
}

function trendPct(cur: number, prev: number): number | undefined {
  if (prev <= 0) return undefined
  return Math.round(((cur - prev) / prev) * 1000) / 10
}

const PERIOD_OPTIONS: { id: ReportPeriod; label: string }[] = [
  { id: 'dia', label: 'Día' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'trimestre', label: 'Trimestre' },
]

export function ReportsScreen() {
  const { isMobile } = useBreakpoint()
  const { user } = useAuth()
  const [period, setPeriod] = useState<ReportPeriod>('semana')
  const [showExport, setShowExport] = useState(false)
  const [report, setReport] = useState<ReportData | null>(null)
  const [prevSummary, setPrevSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const storeId = user?.store_id ?? 1

  const loadReport = useCallback(async () => {
    const range = getPeriodRange(period)
    const prevRange = getPreviousPeriodRange(period)
    setLoading(true)
    setError(false)
    try {
      const [summary, prev, trend, categories, monthly, top, cashFlow] = await Promise.all([
        ReportService.getSummary(storeId, range.start, range.end),
        ReportService.getSummary(storeId, prevRange.start, prevRange.end),
        ReportService.getSalesChartData(storeId, range.days),
        ReportService.getCategories(storeId, range.start, range.end),
        ReportService.getMonthly(storeId, 6),
        ReportService.getTopProducts(storeId, 6, range.start, range.end),
        ReportService.getCashFlow(storeId, range.start, range.end),
      ])
      setReport({
        periodLabel: REPORT_PERIOD_LABELS[period],
        rangeLabel: `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`,
        summary, trend, categories, monthly, top, cashFlow,
      })
      setPrevSummary(prev)
    } catch {
      setError(true)
      toast.error('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }, [period, storeId])

  useEffect(() => { loadReport() }, [loadReport])

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
  }, [pdfUrl])

  const exportPDF = async () => {
    if (!report) return
    try {
      toast.loading('Generando PDF...', { id: 'report-pdf' })
      const { doc, filename } = await generateReportsPdf(report)
      const url = URL.createObjectURL(doc.output('blob'))
      setPdfUrl(url)
      toast.success('PDF generado', { id: 'report-pdf' })
    } catch (err: any) {
      toast.error(err.message || 'Error al generar el PDF', { id: 'report-pdf' })
    }
  }

  const exportXlsx = () => {
    if (!report) return
    try {
      generateReportsXlsx(report)
      toast.success('Excel generado')
    } catch (err: any) {
      toast.error(err.message || 'Error al generar el Excel')
    }
  }

  const shareReport = () => {
    if (!report) return
    const subject = `Reporte de ventas (${report.periodLabel}) - Abarrotes El Roble`
    const body = buildShareText(report)
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)
    toast.success('Abriendo cliente de correo...')
  }

  if (loading && !report) {
    return (
      <div className="space-y-4 p-1">
        <div className="h-14 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-56 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56 bg-muted rounded-2xl animate-pulse" />
          <div className="h-56 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground mb-4">No se pudieron cargar los reportes</p>
        <button onClick={loadReport} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer min-h-[44px]">
          <RefreshCw size={15} />Reintentar
        </button>
      </div>
    )
  }

  if (!report) return null

  const { summary, trend, categories, monthly, top, cashFlow } = report
  const catTotal = categories.reduce((s, c) => s + Number(c.value), 0)
  const maxIngresos = Math.max(...top.map(p => Number(p.ingresos)), 1)
  const monthlyTotal = monthly.reduce((s, m) => s + Number(m.ventas), 0)
  const firstMonth = monthly.length > 0 ? monthly[0].mes : ''
  const lastMonth = monthly.length > 0 ? monthly[monthly.length - 1].mes : ''

  const kpis = [
    { title: 'Ventas totales', value: formatCurrency(summary.ventas), icon: DollarSign, trend: trendPct(summary.ventas, prevSummary?.ventas ?? 0) },
    { title: 'Ganancia neta', value: formatCurrency(summary.ganancia), icon: TrendingUp, trend: trendPct(summary.ganancia, prevSummary?.ganancia ?? 0), accentColor: true },
    { title: 'Transacciones', value: String(summary.transacciones), icon: ShoppingCart, trend: trendPct(summary.transacciones, prevSummary?.transacciones ?? 0) },
    { title: 'Margen promedio', value: summary.margen.toFixed(1) + '%', icon: BarChart3, trend: trendPct(summary.margen, prevSummary?.margen ?? 0) },
  ]

  const exportButtons = (
    <>
      <Btn variant="outline" size="sm" onClick={exportPDF}><Download size={13} />PDF</Btn>
      <Btn variant="outline" size="sm" onClick={exportXlsx}><FileSpreadsheet size={13} />Excel</Btn>
      <Btn variant="outline" size="sm" onClick={shareReport}><Mail size={13} />Compartir</Btn>
    </>
  )

  const tooltipStyle = { borderRadius: '12px', border: '1px solid rgba(27,33,26,0.1)', fontSize: '11px' }

  return (
    <div className="space-y-4 pb-6">
      <div className={'flex gap-3 bg-card rounded-2xl border border-border/50 p-3 shadow-sm ' + (isMobile ? 'flex-col' : 'items-center justify-between')}>
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={'px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap min-h-[40px] transition-all ' + (period === p.id ? 'bg-primary text-white' : 'text-muted-foreground')}>{p.label}</button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          {isMobile ? (
            <button onClick={() => setShowExport(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium cursor-pointer min-h-[44px]">
              <Download size={15} />Exportar
            </button>
          ) : exportButtons}
        </div>
      </div>

      <div className={'grid gap-3 ' + (isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
        {kpis.map(k => <KPICard key={k.title} title={k.title} value={k.value} icon={k.icon} trend={k.trend} accentColor={k.accentColor} compact={isMobile} />)}
      </div>

      <div className={'grid gap-4 ' + (isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
        <div className={'bg-card rounded-2xl border border-border/50 p-4 shadow-sm ' + (isMobile ? '' : 'col-span-2')}>
          <h3 className="font-bold text-foreground text-sm mb-1">Tendencia de ventas</h3>
          <p className="text-xs text-muted-foreground mb-4">Ventas vs Ganancias por día · {report.periodLabel}</p>
          <div className={isMobile ? 'overflow-x-auto' : ''}>
            <div style={isMobile ? { minWidth: 280 } : {}}>
              <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
                <BarChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,33,26,0.06)" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v: number) => ['$' + v.toLocaleString(), '']} contentStyle={tooltipStyle} />
                  <Bar dataKey="ventas" fill="#628141" radius={[5, 5, 0, 0]} name="Ventas" />
                  <Bar dataKey="ganancia" fill="#EBD5AB" radius={[5, 5, 0, 0]} name="Ganancia" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-3">Rentabilidad por categoría</h3>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <PieIcon size={32} className="opacity-20 mb-2" />
              <p className="text-xs">Sin ventas en el periodo</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                    {categories.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [catTotal > 0 ? ((v / catTotal) * 100).toFixed(1) + '%' : '0%', '']} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {categories.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
                    <span className="font-bold text-foreground">{catTotal > 0 ? ((Number(c.value) / catTotal) * 100).toFixed(1) : '0'}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-bold text-foreground text-sm">Ventas mensuales</h3><p className="text-xs text-muted-foreground">{firstMonth} - {lastMonth} · últimos 6 meses</p></div>
          <div className="text-right"><div className="text-lg font-bold text-foreground">{formatCurrency(monthlyTotal)}</div><div className="text-xs text-muted-foreground">Acumulado periodo</div></div>
        </div>
        <div className={isMobile ? 'overflow-x-auto' : ''}>
          <div style={isMobile ? { minWidth: 280 } : {}}>
            <ResponsiveContainer width="100%" height={isMobile ? 130 : 160}>
              <LineChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,33,26,0.06)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(v: number) => ['$' + v.toLocaleString(), 'Ventas']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="ventas" stroke="#628141" strokeWidth={2.5} dot={{ r: 4, fill: '#628141', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="ganancia" stroke="#C4A87A" strokeWidth={2} dot={{ r: 3, fill: '#C4A87A', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={'grid gap-4 ' + (isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-4">Productos más rentables</h3>
          {top.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Sin ventas en el periodo</p>
          ) : (
            <div className="space-y-3.5">
              {top.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">{p.nombre}</span>
                      <span className="text-xs font-bold text-primary ml-2 shrink-0">{p.margen}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: (Number(p.ingresos) / maxIngresos) * 100 + '%' }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{p.ventas} uds</span>
                      <span>{formatCurrency(Number(p.ingresos))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-4">Flujo de efectivo</h3>
          <div className="space-y-1">
            {[
              ['Ingresos por ventas', '+' + formatCurrency(cashFlow.ingresos), 'ingreso'],
              ['Impuestos (IVA)', '-' + formatCurrency(cashFlow.iva), 'egreso'],
              ['Costo de lo vendido', '-' + formatCurrency(cashFlow.costoVendido), 'egreso'],
              ['Flujo neto del periodo', formatCurrency(cashFlow.flujoNeto), 'neto']
            ].map(([l, v, t], i) => (
              <div key={i}
                className={'flex items-center justify-between py-3 border-b border-border/30 last:border-0 ' + (t === 'neto' ? 'mt-1 border-t-2 border-border/60' : '')}>
                <span className="text-sm text-muted-foreground">{l}</span>
                <span className={'text-sm font-bold ' + (t === 'ingreso' ? 'text-green-600' : t === 'egreso' ? 'text-red-500' : 'text-primary')}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomSheet isOpen={showExport} onClose={() => setShowExport(false)} title="Exportar reporte">
        <div className="p-4 space-y-3">
          {[
            { label: 'Descargar PDF', icon: Download, action: exportPDF },
            { label: 'Exportar Excel', icon: FileSpreadsheet, action: exportXlsx },
            { label: 'Compartir por correo', icon: Mail, action: shareReport }
          ].map(e => (
            <button key={e.label} onClick={() => { setShowExport(false); e.action() }}
              className="w-full flex items-center gap-4 p-4 bg-muted rounded-xl text-left cursor-pointer hover:bg-border transition-colors min-h-[64px]">
              <e.icon size={20} className="text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">{e.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {pdfUrl && <PdfPreviewModal url={pdfUrl} filename={reportFilename(report)} onClose={() => setPdfUrl(null)} title="Vista previa del reporte" />}
    </div>
  )
}