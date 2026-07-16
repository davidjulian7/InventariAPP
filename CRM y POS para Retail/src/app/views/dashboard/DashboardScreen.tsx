import { useState } from 'react'
import { DollarSign, TrendingUp, BarChart3, Zap, ShoppingBasket, AlertTriangle, Tag, Sparkles, CheckCircle, Star } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { KPICard } from '../../components/shared/KPICard'
import { Btn } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { salesChartData, categoryData, topProducts, recentSales } from '../../lib/mock-data'

export function DashboardScreen() {
  const { isMobile, isTablet } = useBreakpoint()
  const [chartPeriod, setChartPeriod] = useState('7D')
  const kpi1 = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'
  const kpi2 = isMobile ? 'grid-cols-1' : 'grid-cols-3'
  const chartGrid = isMobile || isTablet ? 'grid-cols-1' : 'grid-cols-3'
  const bottomGrid = isMobile ? 'grid-cols-1' : 'grid-cols-2'
  const aiGrid = isMobile ? 'grid-cols-1' : 'grid-cols-3'

  return (
    <div className="space-y-4 pb-6">
      <div className={`grid ${kpi1} gap-3`}>
        <KPICard title="Ventas de hoy" value="$12,450" subtitle="67 transacciones" icon={DollarSign} trend={8.3} compact={isMobile} />
        <KPICard title="Ventas semana" value="$84,230" subtitle="vs $78,940 anterior" icon={TrendingUp} trend={6.7} compact={isMobile} />
        <KPICard title="Ventas del mes" value="$342,800" subtitle="Meta: $380,000" icon={BarChart3} trend={12.4} compact={isMobile} />
        <KPICard title="Ganancia neta" value="$89,128" subtitle="Margen 26.0%" icon={Zap} trend={4.2} accentColor compact={isMobile} />
      </div>
      <div className={`grid ${kpi2} gap-3`}>
        <KPICard title="Productos vendidos" value="1,247" icon={ShoppingBasket} trend={5.1} compact={isMobile} />
        <KPICard title="Stock bajo" value="8 productos" icon={AlertTriangle} compact={isMobile} />
        <KPICard title="Ticket promedio" value="$187.50" icon={Tag} trend={8.3} compact={isMobile} />
      </div>

      <div className={`grid ${chartGrid} gap-4`}>
        <div className={`bg-card rounded-2xl p-4 border border-border/50 shadow-sm ${!isMobile && !isTablet ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold text-foreground text-sm">Ventas y ganancias</h3><p className="text-xs text-muted-foreground">Tendencia por periodo</p></div>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {['7D', '30D', '90D'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)} className={`px-2.5 py-1.5 text-xs rounded-lg font-medium cursor-pointer ${p === chartPeriod ? 'bg-primary text-white' : 'text-muted-foreground'}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
            <AreaChart data={salesChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#628141" stopOpacity={0.25} /><stop offset="95%" stopColor="#628141" stopOpacity={0} /></linearGradient>
                <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EBD5AB" stopOpacity={0.4} /><stop offset="95%" stopColor="#EBD5AB" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,33,26,0.06)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#7A7F73' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27,33,26,0.1)', fontSize: '11px' }} />
              <Area type="monotone" dataKey="ventas" stroke="#628141" strokeWidth={2.5} fill="url(#gV)" name="Ventas" />
              <Area type="monotone" dataKey="ganancia" stroke="#C4A87A" strokeWidth={2} fill="url(#gG)" name="Ganancia" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-1">Categorías</h3>
          <p className="text-xs text-muted-foreground mb-3">Ventas del mes</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27,33,26,0.1)', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
                <span className="font-bold text-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid ${bottomGrid} gap-4`}>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-foreground text-sm">Más vendidos</h3><Btn variant="ghost" size="sm">Ver todos</Btn></div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{p.nombre}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(p.ventas / 342) * 100}%` }} /></div>
                    <span className="text-xs text-muted-foreground shrink-0">{p.ventas}</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-foreground">${p.ingresos.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-foreground text-sm">Actividad reciente</h3><Btn variant="ghost" size="sm">Ver todo</Btn></div>
          <div className="space-y-2.5">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center gap-3 py-0.5">
                <div className="w-8 h-8 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={14} className="text-green-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{sale.folio}</div>
                  <div className="text-xs text-muted-foreground">{sale.cliente}</div>
                </div>
                <div className="text-sm font-bold text-foreground">${sale.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-foreground rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-accent" /><h3 className="font-bold text-white text-sm">Recomendaciones IA</h3><Badge variant="info">3 nuevas</Badge></div>
        <div className={`grid ${aiGrid} gap-3`}>
          {[
            { title: 'Reabastecer urgente', desc: 'Sabritas Original y Arroz La Merced requieren pedido hoy.', icon: AlertTriangle, color: 'text-amber-400' },
            { title: 'Oportunidad de venta', desc: 'Las bebidas tienen alta rotación los viernes. Considera 2x1.', icon: Star, color: 'text-accent' },
            { title: 'Tendencia positiva', desc: 'Tus ventas llevan 3 semanas por encima de la meta. Excelente!', icon: TrendingUp, color: 'text-secondary' },
          ].map((r, i) => (
            <div key={i} className="bg-white/6 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors">
              <r.icon size={16} className={`${r.color} mb-2`} />
              <div className="text-white text-sm font-semibold mb-1">{r.title}</div>
              <div className="text-white/55 text-xs leading-relaxed">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
