import type { ReactNode } from 'react'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent'
type BtnSize = 'sm' | 'md' | 'lg'

const sizes: Record<BtnSize, string> = {
  sm: 'px-3 py-2 text-xs rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
}

const variants: Record<BtnVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-secondary active:scale-[0.98]',
  secondary: 'bg-secondary/20 text-primary hover:bg-secondary/30',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  outline: 'border border-border text-foreground hover:bg-muted',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  accent: 'bg-accent text-accent-foreground hover:bg-accent/80',
}

export function Btn({ children, variant = 'primary', size = 'md', onClick, className = '', disabled = false }: {
  children: ReactNode; variant?: BtnVariant; size?: BtnSize; onClick?: () => void; className?: string; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer shrink-0 min-h-[44px] ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}>
      {children}
    </button>
  )
}
