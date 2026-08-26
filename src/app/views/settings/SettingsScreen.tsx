import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Users, CreditCard, Bot, Printer, Bell, ChevronDown, Plus, Pencil, KeyRound, Trash2, Loader2, Lock, ShieldCheck, BadgeCheck, Check, Crown } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Btn } from '../../components/shared/Button'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useAuth } from '../../contexts/AuthContext'
import { SettingsService } from '../../services/settings.service'
import { UserService } from '../../services/user.service'
import { AIService, type AIUsage } from '../../services/ai.service'
import { ROLE_LABELS } from '../../lib/constants'
import type { Store, StoreSettings, StoreUser } from '../../types'

const storeSchema = z.object({
  nombre: z.string().min(1, 'El nombre del negocio es requerido'),
  rfc: z.string().optional(),
  direccion: z.string().min(1, 'La dirección es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Ingresa un correo válido').or(z.literal('')),
  web: z.string().optional(),
})

type StoreForm = z.infer<typeof storeSchema>

type PlanId = 'gratis' | 'basico' | 'pro' | 'premium'

interface Plan {
  id: PlanId
  nombre: string
  precioMensual: number
  destacado?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'gratis',
    nombre: 'Gratis',
    precioMensual: 0,
    features: [
      '10 solicitudes de IA al día',
      '1 usuario',
      'Hasta 100 productos',
      'Ventas e inventario básicos',
      'Incluye anuncios',
    ],
  },
  {
    id: 'basico',
    nombre: 'Básico',
    precioMensual: 199,
    features: [
      '50 solicitudes de IA al día',
      '3 usuarios',
      'Productos ilimitados',
      'Reportes básicos',
      'Sin anuncios',
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precioMensual: 399,
    destacado: true,
    features: [
      '200 solicitudes de IA al día',
      '10 usuarios',
      'Reportes avanzados y exportación',
      'Tickets personalizados (PDF y WhatsApp)',
      'Soporte prioritario',
      'Sin anuncios',
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precioMensual: 699,
    features: [
      '1,000 solicitudes de IA al día',
      'Usuarios ilimitados',
      'Todo lo incluido en Pro',
      'Multi-sucursal',
      'Asesor dedicado',
      'Sin anuncios',
    ],
  },
]

const PLAN_LABELS: Record<PlanId, string> = {
  gratis: 'Gratis',
  basico: 'Básico',
  pro: 'Pro',
  premium: 'Premium',
}

function planIdFromValue(value: string): PlanId {
  const v = (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (v.includes('gratis')) return 'gratis'
  if (v.includes('bas')) return 'basico'
  if (v.includes('premium')) return 'premium'
  if (v.includes('pro')) return 'pro'
  return 'basico'
}

function formatMoney(n: number): string {
  return n.toLocaleString('es-MX', { maximumFractionDigits: 0 })
}

const inputClass = (hasError: boolean) =>
  'w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ' +
  (hasError ? 'border-red-300 bg-red-50' : 'border-border bg-muted')

function Field({ label, error, children, full }: { label: string; error?: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked}
      className={'relative w-11 h-6 rounded-full cursor-pointer transition-colors shrink-0 ' + (checked ? 'bg-primary' : 'bg-muted')}>
      <div className={'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ' + (checked ? 'left-6' : 'left-1')} />
    </button>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
      <h2 className="text-base font-bold text-foreground mb-5">{title}</h2>
      {children}
    </div>
  )
}

function BusinessPanel({ store, onSave, isMobile }: { store: Store; onSave: (d: StoreForm) => void; isMobile?: boolean }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
  })

  useEffect(() => {
    reset({
      nombre: store.nombre,
      rfc: store.rfc || '',
      direccion: store.direccion || '',
      telefono: store.telefono || '',
      email: store.email || '',
      web: store.web || '',
    })
  }, [store, reset])

  const py = isMobile ? 'py-3 min-h-[48px]' : 'py-2.5'
  const fields: { name: keyof StoreForm; label: string; full?: boolean; type?: string }[] = [
    { name: 'nombre', label: 'Nombre del negocio' },
    { name: 'rfc', label: 'RFC / Registro fiscal' },
    { name: 'direccion', label: 'Dirección completa', full: true },
    { name: 'telefono', label: 'Teléfono' },
    { name: 'email', label: 'Correo electrónico', type: 'email' },
    { name: 'web', label: 'Sitio web' },
  ]

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <Field key={f.name} label={f.label} error={errors[f.name]?.message} full={f.full}>
            <input {...register(f.name)} type={f.type || 'text'} className={inputClass(!!errors[f.name]) + ' ' + py} />
          </Field>
        ))}
      </div>
      <div className="flex gap-3">
        <Btn type="submit" variant="primary" className={isMobile ? 'flex-1 min-h-[52px]' : ''}>Guardar cambios</Btn>
        {!isMobile && <Btn type="button" variant="ghost">Cancelar</Btn>}
      </div>
    </form>
  )
}

function UserModal({ isMobile, user, onClose, onSaved }: {
  isMobile: boolean; user: StoreUser | null; onClose: () => void; onSaved: () => void
}) {
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState(user?.rol || 'cajero')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!nombre.trim() || !email.trim()) {
      toast.error('Nombre y correo son requeridos')
      return
    }
    if (!user && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setSaving(true)
    try {
      if (user) {
        await UserService.updateUser(user.id, { nombre: nombre.trim(), email: email.trim(), rol })
      } else {
        await UserService.createUser({ nombre: nombre.trim(), email: email.trim(), password, rol })
      }
      toast.success(user ? 'Usuario actualizado' : 'Usuario creado')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const form = (
    <div className="space-y-4">
      <Field label="Nombre completo">
        <input value={nombre} onChange={e => setNombre(e.target.value)} className={inputClass(false)} />
      </Field>
      <Field label="Correo electrónico">
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputClass(false)} />
      </Field>
      {!user && (
        <Field label="Contraseña (mín. 6 caracteres)">
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className={inputClass(false)} />
        </Field>
      )}
      <Field label="Rol">
        <Select value={rol} onValueChange={setRol}>
          <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Btn variant="primary" className="w-full min-h-[48px]" onClick={submit} disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : null}Guardar
      </Btn>
    </div>
  )

  return isMobile ? (
    <BottomSheet isOpen onClose={onClose} title={user ? 'Editar usuario' : 'Nuevo usuario'}>{form}</BottomSheet>
  ) : (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>Administra el acceso y rol del usuario.</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}

function PasswordModal({ isMobile, user, onClose, onSaved }: {
  isMobile: boolean; user: StoreUser | null; onClose: () => void; onSaved: () => void
}) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const submit = async () => {
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setSaving(true)
    try {
      await UserService.changePassword(user.id, password)
      toast.success('Contraseña actualizada')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const form = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Nueva contraseña para <span className="font-semibold text-foreground">{user.nombre}</span></p>
      <Field label="Nueva contraseña (mín. 6 caracteres)">
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" className={inputClass(false)} />
      </Field>
      <Btn variant="primary" className="w-full min-h-[48px]" onClick={submit} disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : null}Guardar contraseña
      </Btn>
    </div>
  )

  return isMobile ? (
    <BottomSheet isOpen onClose={onClose} title="Cambiar contraseña">{form}</BottomSheet>
  ) : (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}

function UsersPanel({ users, currentUserId, onUsersChanged, isMobile }: {
  users: StoreUser[]; currentUserId: number; onUsersChanged: () => void; isMobile: boolean
}) {
  const [modal, setModal] = useState<{ user: StoreUser | null } | null>(null)
  const [pwUser, setPwUser] = useState<StoreUser | null>(null)
  const [toDelete, setToDelete] = useState<StoreUser | null>(null)

  return (
    <Card title="Usuarios">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{users.length} usuario(s) en tu negocio</p>
        <Btn variant="primary" size="sm" onClick={() => setModal({ user: null })}><Plus size={14} />Nuevo usuario</Btn>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/40">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-bold">{u.nombre.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{u.nombre}</span>
                {u.id === currentUserId && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">TÚ</span>}
              </div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">{ROLE_LABELS[u.rol] || u.rol}</span>
            <span className={'text-[10px] font-bold px-2 py-1 rounded-full ' + (u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
              {u.active ? 'Activo' : 'Inactivo'}
            </span>
            <button onClick={() => setModal({ user: u })} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer" title="Editar"><Pencil size={13} /></button>
            <button onClick={() => setPwUser(u)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer" title="Cambiar contraseña"><KeyRound size={13} /></button>
            <button onClick={() => setToDelete(u)} disabled={u.id === currentUserId}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-red-500 hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Desactivar"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {modal && <UserModal isMobile={isMobile} user={modal.user} onClose={() => setModal(null)} onSaved={onUsersChanged} />}
      {pwUser && <PasswordModal isMobile={isMobile} user={pwUser} onClose={() => setPwUser(null)} onSaved={onUsersChanged} />}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={open => !open && setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await UserService.deactivate(toDelete.id)
            toast.success('Usuario desactivado')
            onUsersChanged()
          } catch (err: any) {
            toast.error(err.message || 'Error al desactivar el usuario')
          }
          setToDelete(null)
        }}
        title="Desactivar usuario"
        description={`¿Desactivar a ${toDelete?.nombre}? Podrás reactivarlo después.`}
        confirmText="Desactivar"
        destructive
      />
    </Card>
  )
}

function AIUsagePanel({ settings }: { settings: StoreSettings }) {
  const [usage, setUsage] = useState<AIUsage | null>(null)

  useEffect(() => {
    let active = true
    AIService.getUsage().then(u => { if (active) setUsage(u) }).catch(() => {})
    return () => { active = false }
  }, [])

  const planKey = planIdFromValue(settings.billing_plan)
  const used = usage?.used ?? 0
  const limit = usage?.limit ?? 0
  const remaining = usage?.remaining ?? 0
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const reached = limit > 0 && used >= limit

  return (
    <Card title="Asistente IA">
      <div className="bg-muted/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center"><Bot size={16} className="text-primary" /></div>
            <div>
              <div className="text-sm font-bold text-foreground">Tu plan: {PLAN_LABELS[planKey] || settings.billing_plan}</div>
              <div className="text-xs text-muted-foreground">Solicitudes de IA para hoy</div>
            </div>
          </div>
          <span className={'text-xs font-bold px-2.5 py-1 rounded-full ' + (reached ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary')}>
            {reached ? 'Límite alcanzado' : `${remaining} disponibles`}
          </span>
        </div>

        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div className={'absolute inset-y-0 left-0 rounded-full transition-all duration-500 ' + (reached ? 'bg-red-500' : 'bg-primary')} style={{ width: pct + '%' }} />
        </div>
        <div className="mt-2 text-sm font-semibold text-foreground">{used} de {limit} solicitudes usadas hoy</div>

        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          {reached
            ? 'Llegaste al límite diario de tu plan. El contador se reinicia mañana. Si necesitas más solicitudes, revisa los planes en la sección Pagos.'
            : 'El asistente te ayuda con ventas, inventario y recomendaciones. El contador se reinicia cada día.'}
        </p>

        {planKey === 'gratis' && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <Crown size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tu plan Gratis incluye anuncios y un límite de solicitudes. Con un plan de pago eliminas anuncios y obtienes más solicitudes cada día.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

function CheckoutModal({ isMobile, plan, ciclo, settings, onClose, onPaid }: {
  isMobile: boolean; plan: Plan; ciclo: 'mensual' | 'anual'; settings: StoreSettings;
  onClose: () => void; onPaid: (s: StoreSettings) => void
}) {
  const [nombre, setNombre] = useState('')
  const [numero, setNumero] = useState('')
  const [expira, setExpira] = useState('')
  const [cvc, setCvc] = useState('')
  const [email, setEmail] = useState(settings.billing_email || '')
  const [processing, setProcessing] = useState(false)

  const precio = ciclo === 'anual' ? Math.round(plan.precioMensual * 12 * 0.8) : plan.precioMensual

  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d
  }
  const formatCvc = (v: string) => v.replace(/\D/g, '').slice(0, 4)

  const luhn = (n: string) => {
    let sum = 0
    for (let i = 0; i < n.length; i++) {
      let d = Number(n[n.length - 1 - i])
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
      sum += d
    }
    return sum % 10 === 0
  }

  const validate = (): string | null => {
    if (!nombre.trim()) return 'Ingresa el nombre del titular de la tarjeta'
    const digits = numero.replace(/\D/g, '')
    if (digits.length < 15) return 'Ingresa un número de tarjeta válido'
    if (!luhn(digits)) return 'El número de tarjeta no parece válido'
    const [mm, yy] = expira.split('/')
    const month = Number(mm)
    const year = Number(yy)
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2 || month < 1 || month > 12) return 'La fecha de vencimiento no es válida'
    const expYear = 2000 + year
    const now = new Date()
    if (expYear < now.getFullYear() || (expYear === now.getFullYear() && month < now.getMonth() + 1)) return 'La tarjeta está vencida'
    if (cvc.length < 3) return 'Ingresa el código de seguridad (CVC)'
    return null
  }

  const submit = async () => {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }
    setProcessing(true)
    try {
      const saved = await SettingsService.checkout({
        plan: plan.id,
        ciclo,
        email: email.trim(),
        card_last4: numero.replace(/\D/g, '').slice(-4),
      })
      toast.success(`¡Plan ${plan.nombre} activado!`)
      onPaid(saved)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo completar el pago')
    } finally {
      setProcessing(false)
    }
  }

  const form = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <Lock size={14} className="text-primary shrink-0" />
        <span className="text-xs text-foreground font-semibold">Pago seguro. Procesado con cifrado de extremo a extremo.</span>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 text-sm">
        <span className="font-semibold text-foreground">Plan {plan.nombre}</span>
        <span className="font-bold text-primary">${formatMoney(precio)} {ciclo === 'anual' ? '/año' : '/mes'}</span>
      </div>

      <Field label="Correo para tu factura" full>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="facturas@tutienda.mx" className={inputClass(false)} />
      </Field>
      <Field label="Nombre del titular" full>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Como aparece en la tarjeta" className={inputClass(false)} />
      </Field>
      <Field label="Número de tarjeta" full>
        <input value={numero} onChange={e => setNumero(formatCard(e.target.value))} inputMode="numeric" placeholder="4242 4242 4242 4242" className={inputClass(false)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Vencimiento">
          <input value={expira} onChange={e => setExpira(formatExp(e.target.value))} inputMode="numeric" placeholder="MM/AA" className={inputClass(false)} />
        </Field>
        <Field label="CVC">
          <input value={cvc} onChange={e => setCvc(formatCvc(e.target.value))} inputMode="numeric" placeholder="123" type="password" className={inputClass(false)} />
        </Field>
      </div>

      <Btn variant="primary" className="w-full min-h-[48px]" onClick={submit} disabled={processing}>
        {processing ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
        {processing ? 'Procesando pago...' : `Pagar $${formatMoney(precio)}`}
      </Btn>

      <div className="grid grid-cols-2 gap-2">
        {[
          { Icon: ShieldCheck, text: 'Cifrado SSL 256-bit' },
          { Icon: BadgeCheck, text: 'Procesador certificado PCI-DSS' },
          { Icon: CreditCard, text: 'No guardamos tu tarjeta' },
          { Icon: Lock, text: 'Solo se procesa tu cargo' },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-2">
            <Icon size={13} className="text-primary shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return isMobile ? (
    <BottomSheet isOpen onClose={onClose} title={`Pagar plan ${plan.nombre}`}>{form}</BottomSheet>
  ) : (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pago seguro</DialogTitle>
          <DialogDescription>Tu información bancaria se procesa de forma segura y nunca la guardamos.</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}

function BillingPanel({ settings, isMobile, onSettingsChanged }: {
  settings: StoreSettings; isMobile: boolean; onSettingsChanged: (s: StoreSettings) => void
}) {
  const [ciclo, setCiclo] = useState<'mensual' | 'anual'>(settings.billing_ciclo === 'anual' ? 'anual' : 'mensual')
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)
  const currentPlan = planIdFromValue(settings.billing_plan)

  const switchToFree = async () => {
    try {
      const saved = await SettingsService.checkout({ plan: 'gratis', ciclo })
      toast.success('Cambiaste al plan Gratis')
      onSettingsChanged(saved)
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cambiar el plan')
    }
  }

  const nextCharge = settings.billing_proxima_cobro ? new Date(settings.billing_proxima_cobro).toLocaleDateString('es-MX') : null

  return (
    <Card title="Planes y pagos">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <p className="text-sm text-foreground font-semibold">Elige el plan ideal para tu negocio</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cambia de plan cuando quieras, sin permanencia.</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 shrink-0">
          <button onClick={() => setCiclo('mensual')}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer min-h-[32px] transition-colors ' + (ciclo === 'mensual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
            Mensual
          </button>
          <button onClick={() => setCiclo('anual')}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer min-h-[32px] transition-colors ' + (ciclo === 'anual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
            Anual <span className="text-[10px] text-primary font-bold">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.id
          const price = ciclo === 'anual' ? Math.round(plan.precioMensual * 12 * 0.8) : plan.precioMensual
          return (
            <div key={plan.id}
              className={'relative flex flex-col p-5 rounded-2xl border transition-all ' + (isCurrent ? 'border-primary bg-primary/5' : plan.destacado ? 'border-primary/30 bg-card' : 'border-border/50 bg-card')}>
              {plan.destacado && !isCurrent && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">Recomendado</span>
              )}
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{plan.nombre}</span>
                {isCurrent && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Plan actual</span>}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                {plan.precioMensual === 0 ? (
                  <span className="text-2xl font-bold text-foreground">Gratis</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-foreground">${formatMoney(price)}</span>
                    <span className="text-xs text-muted-foreground">{ciclo === 'anual' ? '/año' : '/mes'}</span>
                  </>
                )}
              </div>
              {plan.precioMensual > 0 && ciclo === 'anual' && (
                <div className="text-[11px] text-muted-foreground">Equivale a ${formatMoney(plan.precioMensual)}/mes</div>
              )}
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check size={13} className="text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <div className="text-center text-xs font-semibold text-muted-foreground py-2.5">Ya estás en este plan</div>
                ) : plan.id === 'gratis' ? (
                  <Btn variant="outline" className="w-full" onClick={switchToFree}>Cambiar a Gratis</Btn>
                ) : (
                  <Btn variant={plan.destacado ? 'primary' : 'outline'} className="w-full" onClick={() => setCheckoutPlan(plan)}>
                    {currentPlan === 'gratis' || plan.precioMensual > 0 ? 'Elegir plan' : 'Mejorar plan'}
                  </Btn>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck size={14} className="text-primary shrink-0" />
        <span>Pago procesado de forma segura por un proveedor certificado. No almacenamos tu información bancaria.</span>
      </div>
      {nextCharge && currentPlan !== 'gratis' && (
        <div className="mt-3 text-xs text-muted-foreground">Tu próximo cargo: <span className="font-semibold text-foreground">{nextCharge}</span></div>
      )}

      {checkoutPlan && (
        <CheckoutModal
          isMobile={isMobile}
          plan={checkoutPlan}
          ciclo={ciclo}
          settings={settings}
          onClose={() => setCheckoutPlan(null)}
          onPaid={onSettingsChanged}
        />
      )}
    </Card>
  )
}

function TicketsPanel({ settings, onSave, isMobile }: { settings: StoreSettings; onSave: (d: { encabezado?: string; pie?: string; mostrar_iva?: boolean }) => void; isMobile?: boolean }) {
  const [encabezado, setEncabezado] = useState(settings.ticket_encabezado)
  const [pie, setPie] = useState(settings.ticket_pie)
  const [mostrarIva, setMostrarIva] = useState(settings.ticket_mostrar_iva)

  useEffect(() => {
    setEncabezado(settings.ticket_encabezado)
    setPie(settings.ticket_pie)
    setMostrarIva(settings.ticket_mostrar_iva)
  }, [settings])

  return (
    <Card title="Configuración de tickets">
      <div className="space-y-4">
        <Field label="Encabezado del ticket" full>
          <textarea value={encabezado} onChange={e => setEncabezado(e.target.value)} rows={2}
            className={inputClass(false) + ' resize-none'} />
        </Field>
        <Field label="Mensaje de pie (despedida)" full>
          <input value={pie} onChange={e => setPie(e.target.value)} className={inputClass(false)} />
        </Field>
        <div className="flex items-center justify-between py-3 border-b border-border/30">
          <div>
            <div className="text-sm font-semibold text-foreground">Mostrar IVA en el ticket</div>
            <div className="text-xs text-muted-foreground">Desglosa el impuesto al pie del ticket</div>
          </div>
          <Toggle checked={mostrarIva} onChange={setMostrarIva} />
        </div>
        <Btn variant="primary" onClick={() => onSave({ encabezado, pie, mostrar_iva: mostrarIva })} className={isMobile ? 'w-full min-h-[52px]' : ''}>
          Guardar configuración
        </Btn>
      </div>
    </Card>
  )
}

function NotificationsPanel({ settings, onToggle }: { settings: StoreSettings; onToggle: (key: keyof Pick<StoreSettings, 'notif_stock_bajo' | 'notif_resumen_diario' | 'notif_agotados' | 'notif_ia'>) => void }) {
  const items: { key: keyof Pick<StoreSettings, 'notif_stock_bajo' | 'notif_resumen_diario' | 'notif_agotados' | 'notif_ia'>; label: string; desc: string }[] = [
    { key: 'notif_stock_bajo', label: 'Alertas de stock bajo', desc: 'Te avisamos cuando un producto está por debajo del mínimo' },
    { key: 'notif_resumen_diario', label: 'Resumen diario de ventas', desc: 'Un resumen de las ventas de cada día' },
    { key: 'notif_agotados', label: 'Alertas de agotados', desc: 'Productos sin existencias que requieren reabastecimiento' },
    { key: 'notif_ia', label: 'Recomendaciones IA', desc: 'Sugerencias e insights generados con inteligencia artificial' },
  ]

  return (
    <Card title="Notificaciones">
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-border/30 last:border-0">
            <div className="pr-4">
              <div className="text-sm font-semibold text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
            <Toggle checked={settings[item.key]} onChange={() => onToggle(item.key)} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">Los cambios se guardan automáticamente.</p>
    </Card>
  )
}

export function SettingsScreen() {
  const { isMobile } = useBreakpoint()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('negocio')
  const [openSection, setOpenSection] = useState<string | null>('negocio')
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [users, setUsers] = useState<StoreUser[]>([])

  const isAdmin = user?.rol === 'admin'

  const loadUsers = async () => {
    try {
      setUsers(await UserService.getUsers())
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await SettingsService.getSettings()
        setStore(data.store)
        setSettings(data.settings)
      } catch (err: any) {
        toast.error(err.message || 'Error al cargar la configuración')
      } finally {
        setLoading(false)
      }
    })()
    if (isAdmin) loadUsers()
  }, [isAdmin])

  const patchSettings = (next: Partial<StoreSettings>) => {
    setSettings(prev => prev ? { ...prev, ...next } : prev)
  }

  const handleSaveStore = async (d: StoreForm) => {
    try {
      const saved = await SettingsService.updateStore(d)
      setStore(saved)
      toast.success('Datos del negocio guardados')
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    }
  }

  const handleSaveTickets = async (d: { encabezado?: string; pie?: string; mostrar_iva?: boolean }) => {
    try {
      const saved = await SettingsService.updateTickets(d)
      patchSettings(saved)
      toast.success('Configuración de tickets guardada')
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    }
  }

  const handleToggleNotif = async (key: keyof Pick<StoreSettings, 'notif_stock_bajo' | 'notif_resumen_diario' | 'notif_agotados' | 'notif_ia'>) => {
    if (!settings) return
    const optimistic: StoreSettings = { ...settings, [key]: !settings[key] }
    setSettings(optimistic)
    try {
      const saved = await SettingsService.updateNotifications(optimistic)
      patchSettings(saved)
    } catch (err: any) {
      setSettings(settings)
      toast.error(err.message || 'Error al guardar')
    }
  }

  if (loading || !store || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    )
  }

  const tabs = [
    { id: 'negocio', label: 'Mi negocio', icon: Building2 },
    ...(isAdmin ? [{ id: 'usuarios', label: 'Usuarios', icon: Users }] : []),
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'ia', label: 'Asistente IA', icon: Bot },
    { id: 'tickets', label: 'Tickets', icon: Printer },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  ]

  const panels: Record<string, ReactNode> = {
    negocio: <BusinessPanel store={store} onSave={handleSaveStore} isMobile={isMobile} />,
    usuarios: <UsersPanel users={users} currentUserId={user?.id || 0} onUsersChanged={loadUsers} isMobile={isMobile} />,
    pagos: <BillingPanel settings={settings} isMobile={isMobile} onSettingsChanged={patchSettings} />,
    ia: <AIUsagePanel settings={settings} />,
    tickets: <TicketsPanel settings={settings} onSave={handleSaveTickets} isMobile={isMobile} />,
    notificaciones: <NotificationsPanel settings={settings} onToggle={handleToggleNotif} />,
  }

  if (isMobile) {
    return (
      <div className="space-y-3 pb-6">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isOpen = openSection === tab.id
          return (
            <div key={tab.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <button onClick={() => setOpenSection(isOpen ? null : tab.id)}
                className="w-full flex items-center justify-between px-4 py-4 cursor-pointer min-h-[60px]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center"><Icon size={16} className="text-primary" /></div>
                  <span className="font-semibold text-foreground">{tab.label}</span>
                </div>
                <ChevronDown size={16} className={'text-muted-foreground transition-transform ' + (isOpen ? 'rotate-180' : '')} />
              </button>
              {isOpen && <div className="px-4 pb-4">{panels[tab.id]}</div>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex gap-5 pb-8">
      <div className="w-48 shrink-0">
        <div className="bg-card rounded-2xl border border-border/50 p-2 space-y-0.5 shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer min-h-[44px] transition-all ' + (activeTab === tab.id ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium')}>
                <Icon size={15} />{tab.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex-1">{panels[activeTab]}</div>
    </div>
  )
}