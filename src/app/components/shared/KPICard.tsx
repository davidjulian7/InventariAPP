import { ArrowUpRight, TrendingDown } from 'lucide-react'

export function KPICard({ title, value, subtitle, icon: Icon, trend, accentColor = false, compact = false, onClick }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; trend?: number; accentColor?: boolean; compact?: boolean; onClick?: () => void
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      className={`rounded-2xl flex flex-col gap-2 shadow-sm border border-border/50 text-left w-full ${compact ? 'p-4' : 'p-5'} ${accentColor ? 'bg-accent text-accent-foreground' : 'bg-card'} ${onClick ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-xl flex items-center justify-center ${compact ? 'w-9 h-9' : 'w-10 h-10'} ${accentColor ? 'bg-foreground/10' : 'bg-primary/10'}`}>
          <Icon size={compact ? 17 : 19} className={accentColor ? 'text-foreground' : 'text-primary'} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className={`font-bold tracking-tight ${compact ? 'text-xl' : 'text-2xl'}`}>{value}</div>
        <div className="text-sm font-semibold mt-0.5 opacity-80">{title}</div>
        {subtitle && !compact && <div className="text-xs mt-0.5 opacity-50">{subtitle}</div>}
      </div>
    </div>
  )
}
