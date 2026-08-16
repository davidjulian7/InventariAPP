import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ShoppingBag, TrendingUp, ArrowUpRight, Sparkles, RefreshCw } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useAuth } from '../../contexts/AuthContext'
import { APP_NAME } from '../../lib/constants'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  remember: z.boolean(),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginScreen() {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@elroble.mx', password: 'admin123', remember: true },
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-sm min-h-[52px]'
  const errorClass = 'text-xs text-red-500 mt-1.5'

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Correo electrónico</label>
        <input type="email" {...register('email')} placeholder="admin@mitienda.mx" className={inputClass + (errors.email ? ' border-red-300' : '')} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Contraseña</label>
        <input type="password" {...register('password')} placeholder="••••••••" className={inputClass + (errors.password ? ' border-red-300' : '')} />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input type="checkbox" {...register('remember')} className="w-4 h-4 accent-primary cursor-pointer" />
          <span className="text-sm text-muted-foreground">Recordarme</span>
        </label>
        <button type="button" className="text-sm text-primary hover:underline font-medium min-h-[44px] px-2">Olvidé mi contraseña</button>
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-secondary transition-colors disabled:opacity-70 flex items-center justify-center gap-2 text-sm cursor-pointer min-h-[52px]">
        {loading ? <><RefreshCw size={15} className="animate-spin" />Iniciando sesión...</> : 'Iniciar sesión'}
      </button>
    </form>
  )

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-foreground px-6 pt-14 pb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><ShoppingBag size={20} className="text-white" /></div>
              <span className="text-xl font-bold text-white">{APP_NAME}</span>
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight">Bienvenido de vuelta</h1>
            <p className="text-white/55 text-sm mt-1">Accede a tu panel de administración</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {['POS', 'Inventario', 'IA', 'Reportes'].map(f => (
                <span key={f} className="px-2.5 py-1 bg-white/10 border border-white/15 text-white/70 text-xs rounded-full">{f}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 px-6 py-8 bg-background -mt-3 rounded-t-3xl shadow-lg">
          {formContent}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-full max-w-md flex flex-col justify-center px-12 py-12 bg-background">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm"><ShoppingBag size={20} className="text-white" /></div><span className="text-xl font-bold text-foreground tracking-tight">{APP_NAME}</span></div>
          <h1 className="text-3xl font-bold text-foreground leading-tight">Bienvenido de vuelta</h1>
          <p className="text-muted-foreground mt-2 text-sm">Accede a tu panel de administración</p>
        </div>
        {formContent}
      </div>
      <div className="flex-1 bg-foreground relative overflow-hidden flex flex-col items-center justify-center p-14">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/25 blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(235,213,171,0.25)' }}><TrendingUp size={15} className="text-accent" /></div>
              <span className="text-white/60 text-xs font-medium">Ventas del mes</span>
            </div>
            <div className="text-white text-2xl font-bold">$342,800</div>
            <div className="flex items-center gap-1.5 mt-1"><ArrowUpRight size={13} className="text-secondary" /><span className="text-secondary text-xs font-semibold">+12.4% vs mes anterior</span></div>
          </div>
          <div className="bg-primary/40 backdrop-blur-sm border border-primary/30 rounded-2xl p-4 ml-8 mb-8">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-accent" /><span className="text-accent text-xs font-semibold">Asistente IA</span></div>
            <p className="text-white/85 text-sm leading-relaxed">Las bebidas representan el 35% de tus ventas. Considera ampliar ese inventario este fin de semana.</p>
          </div>
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold leading-tight mb-3">Tu tienda, gestionada con inteligencia</h2>
            <p className="text-white/55 text-sm leading-relaxed">CRM + POS + Inventario + IA en una sola plataforma.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
