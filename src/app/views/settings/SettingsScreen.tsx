import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Users, CreditCard, Bot, Printer, Bell, Zap, ChevronDown } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Btn } from '../../components/shared/Button'

const settingsSchema = z.object({
  nombre: z.string().min(1, 'El nombre del negocio es requerido'),
  rfc: z.string().optional(),
  direccion: z.string().min(1, 'La dirección es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Ingresa un correo válido'),
  web: z.string().optional(),
})

type SettingsForm = z.infer<typeof settingsSchema>

const formFields: { name: keyof SettingsForm; label: string; full: boolean }[] = [
  { name: 'nombre', label: 'Nombre del negocio', full: false },
  { name: 'rfc', label: 'RFC / Registro fiscal', full: false },
  { name: 'direccion', label: 'Direccion completa', full: true },
  { name: 'telefono', label: 'Telefono', full: false },
  { name: 'email', label: 'Correo electronico', full: false },
  { name: 'web', label: 'Sitio web', full: false },
]

export function SettingsScreen() {
  const { isMobile } = useBreakpoint()
  const [activeTab, setActiveTab] = useState('negocio')
  const [notifications, setNotifications] = useState([true, true, false, true])
  const [openSection, setOpenSection] = useState<string | null>('datos')

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      nombre: 'Abarrotes El Roble',
      rfc: 'AERL850312X01',
      direccion: 'Calle Principal 45, Col. Centro, CDMX 06000',
      telefono: '55-1234-5678',
      email: 'contacto@elroble.mx',
      web: 'www.elroble.mx',
    },
  })

  const onSubmit = (_data: SettingsForm) => {
    toast.success('Cambios guardados correctamente')
  }

  const tabs = [
    { id: 'negocio', label: 'Mi negocio', icon: Building2 },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'ia', label: 'Config. IA', icon: Bot },
    { id: 'tickets', label: 'Tickets', icon: Printer },
  ]

  const inputClass = (hasError: boolean) =>
    'w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ' +
    (hasError ? 'border-red-300 bg-red-50' : 'border-border bg-muted')

  function NotifToggles() {
    return (
      <div className="space-y-1">
        {['Alertas de stock bajo', 'Resumen diario de ventas', 'Alertas de agotados', 'Recomendaciones IA'].map((n, i) => (
          <div key={n} className="flex items-center justify-between py-3.5 border-b border-border/30 last:border-0">
            <span className="text-sm font-semibold text-foreground pr-4">{n}</span>
            <button onClick={() => setNotifications(prev => prev.map((v, idx) => idx === i ? !v : v))}
              className={'relative w-11 h-6 rounded-full cursor-pointer transition-colors shrink-0 ' + (notifications[i] ? 'bg-primary' : 'bg-muted')}>
              <div className={'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ' + (notifications[i] ? 'left-6' : 'left-1')} />
            </button>
          </div>
        ))}
      </div>
    )
  }

  function FormFields({ mobile }: { mobile?: boolean }) {
    const py = mobile ? 'py-3 min-h-[48px]' : 'py-2.5'
    return (
      <>
        {formFields.map(f => {
          const err = errors[f.name]
          return (
            <div key={f.name} className={f.full ? 'col-span-2' : ''}>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{f.label}</label>
              <input {...register(f.name)} className={inputClass(!!err) + ' ' + py} />
              {err && <p className="text-xs text-red-500 mt-1">{err.message}</p>}
            </div>
          )
        })}
      </>
    )
  }

  if (isMobile) {
    const sections = [
      {
        id: 'datos', title: 'Datos del negocio', Icon: Building2, content: (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormFields mobile />
            <Btn type="submit" variant="primary" className="w-full min-h-[52px]">Guardar cambios</Btn>
          </form>
        )
      },
      { id: 'notif', title: 'Notificaciones', Icon: Bell, content: <NotifToggles /> },
      {
        id: 'integ', title: 'Integraciones', Icon: Zap, content: (
          <div className="space-y-3">
            {[
              { name: 'WhatsApp Business', connected: true },
              { name: 'Stripe Terminal', connected: false },
              { name: 'Facturacion SAT', connected: false }
            ].map(int => (
              <div key={int.name} className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                <span className="text-sm font-semibold text-foreground">{int.name}</span>
                <Btn variant={int.connected ? 'secondary' : 'primary'} size="sm">{int.connected ? 'Conectado' : 'Conectar'}</Btn>
              </div>
            ))}
          </div>
        )
      },
    ]

    return (
      <div className="space-y-3 pb-6">
        {sections.map(section => {
          const Icon = section.Icon
          const isOpen = openSection === section.id
          return (
            <div key={section.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <button onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center justify-between px-4 py-4 cursor-pointer min-h-[60px]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center"><Icon size={16} className="text-primary" /></div>
                  <span className="font-semibold text-foreground">{section.title}</span>
                </div>
                <ChevronDown size={16} className={'text-muted-foreground transition-transform ' + (isOpen ? 'rotate-180' : '')} />
              </button>
              {isOpen && <div className="px-4 pb-4">{section.content}</div>}
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
      <div className="flex-1 space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-5">Datos del negocio</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormFields />
          </div>
          <div className="mt-5 flex gap-3">
            <Btn type="submit" variant="primary">Guardar cambios</Btn>
            <Btn type="button" variant="ghost">Cancelar</Btn>
          </div>
        </form>
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-5">Notificaciones</h2>
          <NotifToggles />
        </div>
      </div>
    </div>
  )
}
