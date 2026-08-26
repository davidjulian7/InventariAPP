import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Sparkles, Send, RefreshCw, Plus, TrendingUp, AlertTriangle, Star, Zap } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { useAuth } from '../../contexts/AuthContext'
import { AIService } from '../../services/ai.service'

const initAiMessages = [
  { role: 'assistant' as const, content: 'Hola! Soy tu asistente IA. Puedo analizar ventas, detectar tendencias, alertarte sobre el inventario y darte recomendaciones. En que te ayudo?' },
]

interface AIInsight {
  titulo: string
  desc: string
  tipo: string
}

interface SavedChat {
  id: number
  title: string
  updated_at?: string
  created_at?: string
  messages: { role: string; content: string }[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z').getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} d`
}

const insightStyles: Record<string, { Icon: any; color: string }> = {
  trending_up: { Icon: TrendingUp, color: 'text-green-600' },
  alert: { Icon: AlertTriangle, color: 'text-amber-600' },
  star: { Icon: Star, color: 'text-primary' },
  zap: { Icon: Zap, color: 'text-blue-600' },
}

function InsightsList({ insights }: { insights: AIInsight[] }) {
  return (
    <div className="space-y-3 p-4">
      {insights.length === 0 ? (
        <div className="text-sm text-muted-foreground p-3">Aún no hay insights disponibles.</div>
      ) : (
        insights.map((insight, i) => {
          const style = insightStyles[insight.tipo] || insightStyles.star
          const Icon = style.Icon
          return (
            <div key={i} className="flex gap-3 p-3 bg-muted rounded-xl">
              <Icon size={16} className={style.color + ' shrink-0 mt-0.5'} />
              <div><div className="text-sm font-bold text-foreground">{insight.titulo}</div><div className="text-xs text-muted-foreground">{insight.desc}</div></div>
            </div>
          )
        })
      )}
    </div>
  )
}

export function AIAssistantScreen() {
  const { isMobile } = useBreakpoint()
  const { user } = useAuth()
  const [messages, setMessages] = useState(initAiMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [chatHistory, setChatHistory] = useState<SavedChat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [savingChat, setSavingChat] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const storeId = user?.store_id || 0
  const userId = user?.id || 0

  const loadChatHistory = () => {
    AIService.getChatHistory(userId).then(setChatHistory).catch(() => {})
  }

  useEffect(() => {
    AIService.getInsights(storeId).then(setInsights).catch(() => {})
    loadChatHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const quickQueries = ['Cuanto vendi hoy?', 'Que reabastecer?', 'Mas rentables?', 'Tendencias?']

  const openChat = (chat: SavedChat) => {
    setActiveChatId(chat.id)
    setMessages(chat.messages.length > 0
      ? chat.messages.map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.content }))
      : initAiMessages)
    setInput('')
    setShowInsights(false)
  }

  const startNewChat = async () => {
    const hasConversation = messages.some(m => m.role === 'user')
    if (hasConversation && activeChatId === null && !savingChat) {
      try {
        setSavingChat(true)
        const firstUser = messages.find(m => m.role === 'user')
        const title = (firstUser?.content || 'Chat').slice(0, 40)
        await AIService.saveChat(userId, title, messages)
        loadChatHistory()
      } catch {
        toast.error('No se pudo guardar la conversación anterior')
      } finally {
        setSavingChat(false)
      }
    }
    setMessages(initAiMessages)
    setActiveChatId(null)
    setInput('')
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const reply = await AIService.sendMessage(next, storeId)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un problema al consultar al asistente. Intenta de nuevo.' }])
      console.error(err)
    } finally {
      setLoading(false)
    }
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
        <button onClick={startNewChat} disabled={savingChat} aria-label="Nuevo chat"
          className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-40">
          {savingChat ? <RefreshCw size={13} className="text-muted-foreground animate-spin" /> : <Plus size={15} className="text-muted-foreground" />}
        </button>
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
          <InsightsList insights={insights} />
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
          <InsightsList insights={insights} />
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-3">Historial de chats</h3>
          {chatHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground p-1">Aún no tienes chats guardados. Usa "+" para guardar la conversación actual y empezar una nueva.</p>
          ) : (
            <div className="space-y-1">
              {chatHistory.map(chat => {
                const active = chat.id === activeChatId
                return (
                  <button key={chat.id} onClick={() => openChat(chat)}
                    className={'w-full text-left px-3 py-2.5 rounded-xl cursor-pointer min-h-[48px] transition-colors ' + (active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted')}>
                    <div className={'text-sm font-semibold truncate ' + (active ? 'text-primary' : 'text-foreground')}>{chat.title}</div>
                    <div className="text-xs text-muted-foreground">{timeAgo(chat.updated_at || chat.created_at || '')}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
