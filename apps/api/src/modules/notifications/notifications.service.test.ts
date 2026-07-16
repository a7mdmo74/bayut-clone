import { describe, it, expect, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    notification: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }))

import * as notificationsService from './notifications.service'

describe('Notifications Service', () => {
  it('createNotification should create', async () => {
    await notificationsService.createNotification({
      userId: 'u1', type: 'LEAD', title: 'Test', message: 'Msg',
    })
    expect(mockPrisma.notification.create).toHaveBeenCalled()
  })

  it('getUnreadCount should return count', async () => {
    mockPrisma.notification.count.mockResolvedValue(5)
    const result = await notificationsService.getUnreadCount('u1')
    expect(result).toBe(5)
  })

  it('markAsRead should update', async () => {
    await notificationsService.markAsRead('u1', 'n1')
    expect(mockPrisma.notification.updateMany).toHaveBeenCalled()
  })

  it('markAllAsRead should update all', async () => {
    await notificationsService.markAllAsRead('u1')
    expect(mockPrisma.notification.updateMany).toHaveBeenCalled()
  })

  it('deleteNotification should delete', async () => {
    await notificationsService.deleteNotification('u1', 'n1')
    expect(mockPrisma.notification.deleteMany).toHaveBeenCalled()
  })
})
