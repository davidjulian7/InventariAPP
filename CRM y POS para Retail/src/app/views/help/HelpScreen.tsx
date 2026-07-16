import { useState } from 'react'
import { BookOpen, MessageSquare, Phone, LifeBuoy, ChevronRight, ChevronDown, Mail } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Btn } from '../../components/shared/Button'

const faqs = [
  { q: 'Como agrego un producto nuevo al inventario?', a: 'Ve al modulo de Inventario, haz clic en Agregar producto y completa el formulario con el nombre, SKU, precios y stock inicial.' },
  { q: 'Como configuro los metodos de pago?', a: 'En Configuracion > Pagos puedes activar o desactivar efectivo, transferencia bancaria y terminal bancaria.' },
  { q: 'Como genero un reporte de ventas en PDF?', a: 'Ve al modulo de Reportes, selecciona el periodo y haz clic en el boton PDF en la barra de controles.' },
  { q: 'Como uso el escaner de codigo de barras?', a: 'En el Punto de Venta, haz clic en el boton Escanear. Permite el acceso a la camara cuando se solicite.' },
  { q: 'El asistente IA hace pedidos automaticamente?', a: 'Por ahora analiza y recomienda, pero los pedidos se realizan manualmente. La automatizacion llegara en v3.0.' },
]

export function HelpScreen() {
  const { isMobile } = useBreakpoint()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="space-y-4 pb-6">
      <div className={'grid gap-3 ' + (isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
        {[
          { title: 'Documentacion', desc: 'Guias completas de uso', Icon: BookOpen, bg: 'bg-blue-50 border-blue-200', ic: 'text-blue-600', ibg: 'bg-blue-100' },
          { title: 'Soporte en vivo', desc: 'Chat con un especialista', Icon: MessageSquare, bg: 'bg-green-50 border-green-200', ic: 'text-green-600', ibg: 'bg-green-100' },
          { title: 'Soporte telefonico', desc: 'Lunes a Viernes 9am-7pm', Icon: Phone, bg: 'bg-primary/5 border-primary/20', ic: 'text-primary', ibg: 'bg-primary/10' },
        ].map(s => (
          <div key={s.title} className={'border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow min-h-[100px] ' + s.bg}>
            <div className={'w-11 h-11 rounded-xl ' + s.ibg + ' flex items-center justify-center mb-3'}><s.Icon size={21} className={s.ic} /></div>
            <div className="font-bold text-foreground">{s.title}</div>
            <div className="text-muted-foreground text-sm mt-1">{s.desc}</div>
            <div className={'flex items-center gap-1 text-xs font-bold mt-3 ' + s.ic}>Ver mas <ChevronRight size={13} /></div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
        <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2"><LifeBuoy size={18} className="text-primary" />Preguntas frecuentes</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border/50 rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-4 text-left cursor-pointer min-h-[56px] hover:bg-muted/50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown size={15} className={'text-muted-foreground transition-transform shrink-0 ' + (openFaq === i ? 'rotate-180' : '')} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-foreground rounded-2xl p-5 shadow-sm">
        <div className={'flex gap-4 ' + (isMobile ? 'flex-col' : 'items-center justify-between')}>
          <div>
            <h2 className="text-base font-bold text-white">Necesitas mas ayuda?</h2>
            <p className="text-white/55 text-sm mt-1">Nuestro equipo esta disponible para ayudarte</p>
          </div>
          <div className="flex gap-3">
            <Btn variant="accent" size="md" className="min-h-[48px]"><MessageSquare size={15} />Chat en vivo</Btn>
            <Btn variant="outline" size="md" className="border-white/20 text-white hover:bg-white/10 min-h-[48px]"><Mail size={15} />Email</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
