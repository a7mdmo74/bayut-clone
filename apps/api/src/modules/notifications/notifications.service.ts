import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'

interface CreateNotificationInput {
  userId: string
  type: 'LEAD' | 'VIEWING' | 'PAYMENT' | 'SYSTEM'
  title: string
  message: string
  link?: string
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    })
  } catch (err) {
    logger.error({ err, userId: input.userId }, 'Failed to create notification')
  }
}

export async function getNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getUnreadCount(userId: string) {
  const result = await prisma.notification.count({
    where: { userId, read: false },
  })
  return result
}

export async function markAsRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  })
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

export async function deleteNotification(userId: string, notificationId: string) {
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  })
}
