import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'

interface LogActionInput {
  userId: string
  action: string
  targetType: string
  targetId: string
  details?: Record<string, any>
  ipAddress?: string
}

export async function logAction(input: LogActionInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        details: input.details || undefined,
        ipAddress: input.ipAddress,
      },
    })
  } catch (err) {
    logger.error({ err, action: input.action }, 'Failed to write audit log')
  }
}

export async function getAuditLogs(params: {
  page?: number
  limit?: number
  targetType?: string
  userId?: string
}) {
  const page = params.page || 1
  const limit = params.limit || 50
  const skip = (page - 1) * limit

  const where: Record<string, any> = {}
  if (params.targetType) where.targetType = params.targetType
  if (params.userId) where.userId = params.userId

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
