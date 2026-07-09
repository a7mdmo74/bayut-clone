import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { UpdateUserStatusInput, PaginationQuery } from '@repo/types'

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

export async function updateUserStatus(userId: string, input: UpdateUserStatusInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) {
    throw new AppError(404, 'User not found')
  }

  return prisma.user.update({
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
