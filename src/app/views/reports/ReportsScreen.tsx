import { useState } from 'react'
import { DollarSign, TrendingUp, BarChart3, ShoppingCart, Download, Mail } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { KPICard } from '../../components/shared/KPICard'
import { Btn } from '../../components/shared/Button'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { salesChartData, monthlyData, categoryData, topProducts } from '../../lib/mock-data'

export function ReportsScreen() {
  const { isMobile } = useBreakpoint()
  const [period, setPeriod] = useState('semana')
  const [showExport, setShowExport] = useState(false)

  return (
    <div className="space-y-4 pb-6">
      <div className={'flex gap-3 bg-card rounded-2xl border border-border/50 p-3 shadow-sm ' + (isMobile ? 'flex-col' : 'items-center justify-between')}>
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {[
            { id: 'dia', l: 'Dia' },
            { id: 'semana', l: 'Semana' },
            { id: 'mes', l: 'Mes' },
            { id: 'trimestre', l: 'Trimestre' }
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={'px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap min-h-[40px] transition-all ' + (period === p.id ? 'bg-primary text-white' : 'text-muted-foreground')}>{p.l}</button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          {isMobile ? (
            <button onClick={() => setShowExport(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium cursor-pointer min-h-[44px]">
              <Download size={15} />Exportar
            </button>
          ) : (
            <>
              <Btn variant="outline" size="sm"><Download size={13} />PDF</Btn>
              <Btn variant="outline" size="sm"><Download size={13} />Excel</Btn>
              <Btn variant="outline" size="sm"><Mail size={13} />Compartir</Btn>
            </>
          )}
        </div>
      </div>

      <div className={'grid gap-3 ' + (isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
        <KPICard title="Ventas totales" value="$84,230" icon={DollarSign} trend={6.7} compact={isMobile} />
        <KPICard title="Ganancia neta" value="$21,900" icon={TrendingUp} trend={4.2} accentColor compact={isMobile} />
        <KPICard title="Transacciones" value="452" icon={ShoppingCart} trend={3.1} compact={isMobile} />
        <KPICard title="Margen promedio" value="24.8%" icon={BarChart3} trend={1.2} compact={isMobile} />
      </div>

      <div className={'grid gap-4 ' + (isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
        <div className={'bg-card rounded-2xl border border-border/50 p-4 shadow-sm ' + (isMobile ? '' : 'col-span-2')}>
          <h3 className="font-bold text-foreground text-sm mb-1">Tendencia de ventas</h3>
          <p className="text-xs text-muted-foreground mb-4">Ventas vs Ganancias por dia</p>
          <div className={isMobile ? 'overflow-x-auto' : ''}>
            <div style={isMobile ? { minWidth: 280 } : {}}>
              <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
                <BarChart data={salesChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,33,26,0.06)" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v: number) => ['$' + v.toLocaleString(), '']} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27,33,26,0.1)', fontSize: '11px' }} />
                  <Bar dataKey="ventas" fill="#628141" radius={[5, 5, 0, 0]} name="Ventas" />
                  <Bar dataKey="ganancia" fill="#EBD5AB" radius={[5, 5, 0, 0]} name="Ganancia" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-3">Rentabilidad por categoria</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [v + '%', '']} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27,33,26,0.1)', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
                <span className="font-bold text-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-bold text-foreground text-sm">Ventas mensuales 2025</h3><p className="text-xs text-muted-foreground">Enero - Junio</p></div>
          <div className="text-right"><div className="text-lg font-bold text-foreground">$1,949,800</div><div className="text-xs text-muted-foreground">Acumulado YTD</div></div>
        </div>
        <div className={isMobile ? 'overflow-x-auto' : ''}>
          <div style={isMobile ? { minWidth: 280 } : {}}>
            <ResponsiveContainer width="100%" height={isMobile ? 130 : 160}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,33,26,0.06)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(v: number) => ['$' + v.toLocaleString(), 'Ventas']} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27,33,26,0.1)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="ventas" stroke="#628141" strokeWidth={2.5} dot={{ r: 4, fill: '#628141', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={'grid gap-4 ' + (isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-4">Productos mas rentables</h3>
          <div className="space-y-3.5">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">{p.nombre}</span>
                    <span className="text-xs font-bold text-primary ml-2 shrink-0">{p.margen}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: (p.ventas / 342) * 100 + '%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-4">Flujo de efectivo</h3>
          <div className="space-y-1">
            {[
              ['Ingresos por ventas', '+$84,230', 'ingreso'],
              ['Compras a proveedores', '-$52,300', 'egreso'],
              ['Gastos operativos', '-$8,400', 'egreso'],
              ['Impuestos (IVA)', '-$11,640', 'egreso'],
              ['Flujo neto del periodo', '$11,890', 'neto']
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
            { label: 'Descargar PDF', icon: Download },
            { label: 'Exportar Excel', icon: Download },
            { label: 'Compartir por correo', icon: Mail }
          ].map(e => (
            <button key={e.label}
              className="w-full flex items-center gap-4 p-4 bg-muted rounded-xl text-left cursor-pointer hover:bg-border transition-colors min-h-[64px]">
              <e.icon size={20} className="text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">{e.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
