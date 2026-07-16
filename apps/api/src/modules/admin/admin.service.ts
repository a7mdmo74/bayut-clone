import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { UpdateUserStatusInput, PaginationQuery } from '@repo/types'
import { logAction } from '../audit/audit.service'

export async function getDashboardStats() {
  const [totalUsers, totalAgents, totalProperties, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'AGENT' } }),
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.aggregate({
      _sum: { amountAed: true },
      where: { status: 'CAPTURED' },
    }),
  ])

  return {
    totalUsers,
    totalAgents,
    totalProperties,
    totalRevenue: totalRevenue._sum.amountAed || 0,
  }
}

export async function getRecentActivity() {
  // Get recent users, properties, and payments
  const [recentUsers, recentProperties, recentPayments] = await Promise.all([
    prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.property.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amountAed: true,
        userId: true,
        createdAt: true,
      },
    }),
  ])

  // Format activities
  const activities = [
    ...recentUsers.map(user => ({
      id: `user-${user.id}`,
      action: user.role === 'AGENT' ? 'New agent registered' : 'New user registered',
      user: `${user.firstName} ${user.lastName}`,
      time: formatTimeAgo(user.createdAt),
    })),
    ...recentProperties.map(property => ({
      id: `property-${property.id}`,
      action: 'New property listed',
      user: `${property.owner.firstName} ${property.owner.lastName}`,
      time: formatTimeAgo(property.createdAt),
    })),
    ...recentPayments.map(payment => ({
      id: `payment-${payment.id}`,
      action: `New subscription (AED ${payment.amountAed})`,
      user: `User ${payment.userId}`,
      time: formatTimeAgo(payment.createdAt),
    })),
  ]

  // Sort by time and take top 10
  return activities.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 10)
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  return `${diffDays} days ago`
}

export async function getAllUsers(pagination: PaginationQuery) {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ])

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateUserStatus(userId: string, input: UpdateUserStatusInput, adminId: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) {
    throw new AppError(404, 'User not found')
  }

  const result = await prisma.user.update({
    where: { id: userId },
    data: { isActive: input.isActive },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
  })

  logAction({
    userId: adminId,
    action: input.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetType: 'User',
    targetId: userId,
    details: { email: user.email, wasActive: user.isActive, nowActive: input.isActive },
    ipAddress,
  })

  return result
}

export async function getPendingProperties() {
  return prisma.property.findMany({
    where: { status: 'DRAFT' },
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

export async function reviewPropertyStatus(
  propertyId: string,
  input: { status: 'ACTIVE' | 'REJECTED' },
  adminId: string,
  ipAddress?: string
) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  if (property.status !== 'DRAFT') {
    throw new AppError(400, 'Only draft properties can be reviewed')
  }

  const updatedProperty = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status: input.status,
      ...(input.status === 'ACTIVE' ? { publishedAt: new Date() } : {}),
    },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  logAction({
    userId: adminId,
    action: input.status === 'ACTIVE' ? 'PROPERTY_APPROVED' : 'PROPERTY_REJECTED',
    targetType: 'Property',
    targetId: propertyId,
    details: { title: property.title, previousStatus: property.status, newStatus: input.status },
    ipAddress,
  })

  return {
    id: updatedProperty.id,
    status: updatedProperty.status,
    owner: updatedProperty.owner,
  }
}
