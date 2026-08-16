import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, RefreshCw, TrendingUp, AlertTriangle, Star, Zap, Bot } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Btn } from '../../components/shared/Button'
import { BottomSheet } from '../../components/shared/BottomSheet'

const initAiMessages = [
  { role: 'assistant' as const, content: 'Hola! Soy tu asistente IA. Puedo analizar ventas, detectar tendencias, alertarte sobre el inventario y darte recomendaciones. En que te ayudo?' },
  { role: 'user' as const, content: 'Cuanto vendi hoy?' },
  { role: 'assistant' as const, content: 'Ventas del dia:\n\nHoy generaste $12,450 con 67 transacciones. Ticket promedio $185.82.\n\nEsto es +8.3% vs el lunes pasado. Mejor hora: 1pm-2pm con $2,340.' },
  { role: 'user' as const, content: 'Que debo reabastecer urgentemente?' },
  { role: 'assistant' as const, content: 'Reabastecimiento urgente:\n\nAgotados: Sabritas Original 45g - 0 uds.\n\nStock bajo:\n- Leche Lala 1L - 12 uds. (min. 15)\n- Arroz La Merced - 8 uds. (min. 12)\n- Detergente Ariel - 3 uds. (min. 8)\n\nLa Leche Lala es prioridad alta por su alta rotacion.' },
]

const aiInsights = [
  { titulo: 'Ventas al alza', desc: '+8.3% vs semana anterior', icon: TrendingUp, color: 'text-green-600' },
  { titulo: '4 en riesgo', desc: 'Requieren reabastecimiento', icon: AlertTriangle, color: 'text-amber-600' },
  { titulo: 'Bebidas lideran', desc: '35% del total de ventas', icon: Star, color: 'text-primary' },
  { titulo: 'Proyeccion mes', desc: '$380,000 estimado', icon: Zap, color: 'text-blue-600' },
]

function InsightsList() {
  return (
    <div className="space-y-3 p-4">
      {aiInsights.map((insight, i) => {
        const Icon = insight.icon
        return (
          <div key={i} className="flex gap-3 p-3 bg-muted rounded-xl">
            <Icon size={16} className={insight.color + ' shrink-0 mt-0.5'} />
            <div><div className="text-sm font-bold text-foreground">{insight.titulo}</div><div className="text-xs text-muted-foreground">{insight.desc}</div></div>
          </div>
        )
      })}
      <div className="bg-foreground rounded-xl p-4">
        <div className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wide">Resumen</div>
        {[
          ['Ventas hoy', '$12,450', 'text-secondary'],
          ['Inventario', '8 productos', 'text-white'],
          ['Stock bajo', '4 alertas', 'text-amber-400'],
          ['Margen', '24.8%', 'text-secondary']
        ].map(([l, v, c]) => (
          <div key={l} className="flex justify-between py-1.5 border-b border-white/8 last:border-0">
            <span className="text-white/55 text-xs">{l}</span>
            <span className={'text-xs font-bold ' + c}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AIAssistantScreen() {
  const { isMobile } = useBreakpoint()
  const [messages, setMessages] = useState(initAiMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const quickQueries = ['Cuanto vendi hoy?', 'Que reabastecer?', 'Mas rentables?', 'Tendencias?']

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Analizando los datos de tu negocio... Basandome en el historial de ventas e inventario, tu negocio muestra una tendencia positiva. Te gustaria que profundice en algun aspecto especifico?'
      }])
      setLoading(false)
    }, 1400)
  }

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, loading])

  const chatPanel = (
    <div className={'flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm ' + (isMobile ? 'h-full' : 'flex-1')}>
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 shrink-0">
        <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center shrink-0"><Sparkles size={15} className="text-accent" /></div>
        <div className="flex-1">
          <div className="font-bold text-foreground text-sm">Asistente RetailOS</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-secondary rounded-full" /><span className="text-xs text-muted-foreground">Conectado a tus datos</span></div>
        </div>
        {isMobile && (
          <button onClick={() => setShowInsights(true)}
            className="text-xs text-primary font-semibold px-3 py-2 bg-primary/10 rounded-xl cursor-pointer min-h-[36px]">Insights</button>
        )}
        <button className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center cursor-pointer shrink-0"><RefreshCw size={13} className="text-muted-foreground" /></button>
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={'flex gap-3 ' + (msg.role === 'user' ? 'flex-row-reverse' : '')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-foreground rounded-xl flex items-center justify-center shrink-0 mt-0.5"><Sparkles size={13} className="text-accent" /></div>
            )}
            <div className={'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ' + (msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm')}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-foreground rounded-xl flex items-center justify-center shrink-0"><Sparkles size={13} className="text-accent" /></div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: d + 'ms' }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-2.5 border-t border-border/30 flex gap-2 overflow-x-auto shrink-0">
        {quickQueries.map(q => (
          <button key={q} onClick={() => sendMessage(q)}
            className="shrink-0 px-3 py-2 bg-primary/8 text-primary text-xs rounded-xl font-semibold whitespace-nowrap border border-primary/15 cursor-pointer min-h-[36px]">{q}</button>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border/50 shrink-0">
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Pregunta sobre ventas, inventario o tendencias..."
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]" />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-secondary disabled:opacity-40 cursor-pointer shrink-0 min-w-[44px]">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ height: 'calc(100vh - 56px - 64px)' }} className="flex flex-col">
        {chatPanel}
        <BottomSheet isOpen={showInsights} onClose={() => setShowInsights(false)} title="Insights IA">
          <InsightsList />
        </BottomSheet>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-112px)] pb-4">
      {chatPanel}
      <div className="w-72 flex flex-col gap-4 shrink-0">
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-auto flex-1">
          <div className="flex items-center gap-2 p-4 border-b border-border/50">
            <Sparkles size={15} className="text-primary" /><h3 className="font-bold text-foreground text-sm">Insights IA</h3>
          </div>
          <InsightsList />
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-3">Historial de chats</h3>
          <div className="space-y-1">
            {[
              { t: 'Analisis junio', time: 'Hace 2 horas', active: true },
              { t: 'Reabastecimiento urgente', time: 'Ayer' },
              { t: 'Rentabilidad categorias', time: 'Hace 3 dias' }
            ].map((chat, i) => (
              <button key={i}
                className={'w-full text-left px-3 py-2.5 rounded-xl cursor-pointer min-h-[48px] transition-colors ' + (chat.active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted')}>
                <div className={'text-sm font-semibold truncate ' + (chat.active ? 'text-primary' : 'text-foreground')}>{chat.t}</div>
                <div className="text-xs text-muted-foreground">{chat.time}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
