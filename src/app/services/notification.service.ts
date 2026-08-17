import { apiFetch } from './api'
import type { AppNotification } from '../types'

export class NotificationService {
  static async getNotifications(): Promise<{ notifications: AppNotification[]; unread: number }> {
    return apiFetch<{ notifications: AppNotification[]; unread: number }>('/notifications')
  }

  static async markRead(id: number): Promise<void> {
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' })
  }

  static async markAllRead(): Promise<void> {
    await apiFetch('/notifications/read-all', { method: 'POST' })
  }
}