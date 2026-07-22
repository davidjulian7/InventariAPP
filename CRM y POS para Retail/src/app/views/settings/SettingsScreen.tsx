import { useState } from 'react'
import { toast } from 'sonner'
import { Building2, Users, CreditCard, Bot, Printer, Bell, Zap, ChevronDown } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Btn } from '../../components/shared/Button'

export function SettingsScreen() {
  const { isMobile } = useBreakpoint()
  const [activeTab, setActiveTab] = useState('negocio')
  const [notifications, setNotifications] = useState([true, true, false, true])
  const [openSection, setOpenSection] = useState<string | null>('datos')

  const tabs = [
    { id: 'negocio', label: 'Mi negocio', icon: Building2 },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'ia', label: 'Config. IA', icon: Bot },
    { id: 'tickets', label: 'Tickets', icon: Printer },
  ]

  const formFields = [
    { label: 'Nombre del negocio', value: 'Abarrotes El Roble', full: false },
    { label: 'RFC / Registro fiscal', value: 'AERL850312X01', full: false },
    { label: 'Direccion completa', value: 'Calle Principal 45, Col. Centro, CDMX 06000', full: true },
    { label: 'Telefono', value: '55-1234-5678', full: false },
    { label: 'Correo electronico', value: 'contacto@elroble.mx', full: false },
    { label: 'Sitio web', value: 'www.elroble.mx', full: false },
  ]

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

  if (isMobile) {
    const sections = [
      {
        id: 'datos', title: 'Datos del negocio', Icon: Building2, content: (
          <div className="space-y-4">
            {formFields.map(f => (
              <div key={f.label}>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">{f.label}</label>
                <input defaultValue={f.value}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]" />
              </div>
            ))}
            <Btn variant="primary" className="w-full min-h-[52px]" onClick={() => toast.success('Cambios guardados correctamente')}>Guardar cambios</Btn>
          </div>
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
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-5">Datos del negocio</h2>
          <div className="grid grid-cols-2 gap-4">
            {formFields.map(f => (
              <div key={f.label} className={f.full ? 'col-span-2' : ''}>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">{f.label}</label>
                <input defaultValue={f.value}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3"><Btn variant="primary" onClick={() => toast.success('Cambios guardados correctamente')}>Guardar cambios</Btn><Btn variant="ghost">Cancelar</Btn></div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-5">Notificaciones</h2>
          <NotifToggles />
        </div>
      </div>
    </div>
  )
}
