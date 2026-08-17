import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { NotificationService } from '../../services/notification.service'
import { BottomSheet } from '../shared/BottomSheet'
import type { AppNotification } from '../../types'

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

export function NotificationsBell({ mobile }: { mobile: boolean }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await NotificationService.getNotifications()
      setNotifications(data.notifications)
      setUnread(data.unread)
    } catch {
      setNotifications([])
      setUnread(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!open) return
    load()
    if (mobile) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, mobile])

  const markRead = async (n: AppNotification) => {
    if (n.leida) return
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x))
    setUnread(prev => Math.max(0, prev - 1))
    try {
      await NotificationService.markRead(n.id)
    } catch {
      toast.error('Error al actualizar la notificación')
    }
  }

  const markAll = async () => {
    setNotifications(prev => prev.map(x => ({ ...x, leida: true })))
    setUnread(0)
    try {
      await NotificationService.markAllRead()
      toast.success('Notificaciones marcadas como leídas')
    } catch {
      toast.error('Error al actualizar las notificaciones')
    }
  }

  const list = (
    <div>
      <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border/50">
        <div className="text-sm font-bold text-foreground">
          Notificaciones{unread > 0 && <span className="ml-2 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="flex items-center gap-1 text-xs font-semibold text-primary cursor-pointer hover:underline">
            <CheckCheck size={13} />Marcar leídas
          </button>
        )}
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No tienes notificaciones</div>
        ) : (
          notifications.map(n => (
            <button key={n.id} onClick={() => markRead(n)}
              className={'w-full text-left px-5 py-3 flex gap-3 cursor-pointer hover:bg-muted/60 transition-colors ' + (n.leida ? '' : 'bg-primary/5')}>
              <div className={'mt-1.5 w-2 h-2 rounded-full shrink-0 ' + (n.leida ? 'bg-border' : 'bg-primary')} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{n.title}</div>
                {n.descripcion && <div className="text-xs text-muted-foreground mt-0.5">{n.descripcion}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )

  const bellBtn = (
    <button onClick={() => setOpen(o => !o)} aria-label="Notificaciones"
      className="relative w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer min-w-[36px]">
      <Bell size={17} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-card">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )

  if (mobile) {
    return (
      <>
        {bellBtn}
        <BottomSheet isOpen={open} onClose={() => setOpen(false)}>{list}</BottomSheet>
      </>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      {bellBtn}
      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
          {list}
        </div>
      )}
    </div>
  )
}