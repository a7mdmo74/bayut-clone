import type { Request, Response } from 'express'
import * as notificationsService from './notifications.service'

export async function getNotifications(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const unreadOnly = req.query.unread === 'true'
  const notifications = await notificationsService.getNotifications(req.user.userId, unreadOnly)
  res.json(notifications)
}

export async function getUnreadCount(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const count = await notificationsService.getUnreadCount(req.user.userId)
  res.json({ count })
}

export async function markAsRead(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const id = req.params.id as string
  await notificationsService.markAsRead(req.user.userId, id)
  res.json({ success: true })
}

export async function markAllAsRead(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  await notificationsService.markAllAsRead(req.user.userId)
  res.json({ success: true })
}

export async function deleteNotification(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const id = req.params.id as string
  await notificationsService.deleteNotification(req.user.userId, id)
  res.json({ success: true })
}
