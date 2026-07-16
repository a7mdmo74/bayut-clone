import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import { VIEWING_POLICY } from '@repo/types'
import type { ViewingStatus } from '@repo/types'
import { sendViewingDepositEmail } from '../../lib/email'

const VIEWING_DEPOSIT_AMOUNT = 200 // AED 200 viewing deposit

// ==========================================
// DTO TRANSFORMERS
// ==========================================

function toViewingDTO(viewing: any) {
  return {
    id: viewing.id,
    propertyId: viewing.propertyId,
    buyerId: viewing.buyerId,
    agentId: viewing.agentId,
    scheduledAt: viewing.scheduledAt.toISOString(),
    status: viewing.status,
    depositStatus: viewing.depositStatus,
    depositAmount: Number(viewing.depositAmount),
    depositPaymentId: viewing.depositPaymentId,
    cancelReason: viewing.cancelReason,
    canceledAt: viewing.canceledAt?.toISOString() || null,
    completedAt: viewing.completedAt?.toISOString() || null,
    createdAt: viewing.createdAt.toISOString(),
    updatedAt: viewing.updatedAt.toISOString(),
    property: viewing.property
      ? {
          id: viewing.property.id,
          title: viewing.property.title,
          slug: viewing.property.slug,
          images: viewing.property.images?.map((img: any) => img.url) || [],
          community: viewing.property.community
            ? {
                id: viewing.property.community.id,
                name: viewing.property.community.name,
                emirate: viewing.property.community.emirate?.name || 'Unknown',
              }
            : null,
        }
      : null,
  }
}

// ==========================================
// VIEWING REQUEST (FREE — no deposit)
// ==========================================

export async function requestViewing(buyerId: string, propertyId: string, scheduledAt: Date, requireDeposit = false) {
  const minTime = new Date(Date.now() + VIEWING_POLICY.MIN_HOURS_AHEAD * 60 * 60 * 1000)
  if (new Date(scheduledAt) < minTime) {
    throw new AppError(
      400,
      `Viewing must be scheduled at least ${VIEWING_POLICY.MIN_HOURS_AHEAD} hours in advance`
    )
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { agent: true },
  })
  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  const agentId = property.agentId ?? null

  const existingViewing = await prisma.viewing.findFirst({
    where: {
      buyerId,
      propertyId,
      status: {
        notIn: ['COMPLETED', 'CANCELED_BY_BUYER', 'CANCELED_BY_AGENT'],
      },
    },
  })
  if (existingViewing) {
    throw new AppError(409, 'You already have an active viewing request for this property')
  }

  const depositAmount = requireDeposit ? VIEWING_DEPOSIT_AMOUNT : 0
  const initialStatus = requireDeposit ? 'DEPOSIT_PENDING' : 'CONFIRMED'
  const initialDepositStatus = requireDeposit ? 'PENDING' : 'REFUNDED'

  const viewing = await prisma.viewing.create({
    data: {
      propertyId,
      buyerId,
      agentId,
      scheduledAt: new Date(scheduledAt),
      status: initialStatus,
      depositStatus: initialDepositStatus,
      depositAmount,
      depositPaymentId: null,
    },
    include: {
      property: {
        include: {
          images: true,
          community: { include: { emirate: true } },
        },
      },
      buyer: {
        select: {
          id: true,
          firstName: true,
          email: true,
        },
      },
    },
  })

  // Send viewing confirmation email (fire-and-forget with error logging)
  sendViewingDepositEmail({
    userEmail: viewing.buyer.email,
    userName: viewing.buyer.firstName,
    propertyTitle: property.title,
    scheduledDate: scheduledAt.toISOString(),
    depositAmount,
    locale: 'ar', // Default to Arabic, would ideally come from user preference
    isCancelled: false,
  }).catch(error => {
    logger.error({ error, viewingId: viewing.id }, 'Failed to send viewing confirmation email')
  })

  logger.info(
    `Viewing requested: ${viewing.id} by buyer ${buyerId} for property ${propertyId} at ${scheduledAt} (deposit: ${depositAmount})`
  )

  return {
    viewing: toViewingDTO(viewing),
  }
}

// ==========================================
// VIEWING QUERIES
// ==========================================

export async function getMyViewings(buyerId: string) {
  const viewings = await prisma.viewing.findMany({
    where: { buyerId },
    include: {
      property: {
        include: {
          images: { take: 1, orderBy: { isCover: 'desc' } },
          community: { include: { emirate: true } },
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  })
  return viewings.map(toViewingDTO)
}

export async function getAgentViewings(userId: string) {
  const agent = await prisma.agent.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!agent) {
    return []
  }

  const viewings = await prisma.viewing.findMany({
    where: { property: { agentId: agent.id } },
    include: {
      property: {
        include: {
          images: { take: 1, orderBy: { isCover: 'desc' } },
          community: { include: { emirate: true } },
        },
      },
      buyer: {
        select: {
          id: true,
          firstName: true,
          email: true,
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return viewings.map(viewing => ({
    ...toViewingDTO(viewing),
    buyer: viewing.buyer,
  }))
}

export async function getViewing(viewingId: string, userId: string, userRole?: string) {
  const viewing = await prisma.viewing.findUnique({
    where: { id: viewingId },
    include: {
      property: {
        include: {
          images: { take: 1, orderBy: { isCover: 'desc' } },
          community: { include: { emirate: true } },
        },
      },
    },
  })

  if (!viewing) {
    throw new AppError(404, 'Viewing not found')
  }

  if (viewing.buyerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You do not have permission to view this viewing')
  }

  return toViewingDTO(viewing)
}

// ==========================================
// VIEWING CANCELLATION
// ==========================================

export async function cancelViewing(
  viewingId: string,
  userId: string,
  userRole?: string,
  reason?: string
) {
  const viewing = await prisma.viewing.findUnique({
    where: { id: viewingId },
    include: {
      buyer: {
        select: {
          id: true,
          firstName: true,
          email: true,
        },
      },
      property: {
        select: {
          title: true,
        },
      },
    },
  })

  if (!viewing) {
    throw new AppError(404, 'Viewing not found')
  }

  if (viewing.buyerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You do not have permission to cancel this viewing')
  }

  if (['COMPLETED', 'CANCELED_BY_BUYER', 'CANCELED_BY_AGENT', 'NO_SHOW'].includes(viewing.status)) {
    throw new AppError(400, 'This viewing cannot be canceled')
  }

  const now = new Date()
  const updatedViewing = await prisma.viewing.update({
    where: { id: viewingId },
    data: {
      status: 'CANCELED_BY_BUYER',
      cancelReason: reason,
      canceledAt: now,
    },
  })

  // Send viewing cancellation email (fire-and-forget with error logging)
  sendViewingDepositEmail({
    userEmail: viewing.buyer.email,
    userName: viewing.buyer.firstName,
    propertyTitle: viewing.property.title,
    scheduledDate: viewing.scheduledAt.toISOString(),
    depositAmount: Number(viewing.depositAmount),
    locale: 'ar', // Default to Arabic, would ideally come from user preference
    isCancelled: true,
  }).catch(error => {
    logger.error({ error, viewingId }, 'Failed to send viewing cancellation email')
  })

  logger.info(`Viewing canceled: ${viewingId} by user ${userId}`)

  return {
    viewing: toViewingDTO(updatedViewing),
    refundAmount: 0,
    depositStatus: updatedViewing.depositStatus,
  }
}

// ==========================================
// VIEWING STATUS UPDATES (for agents)
// ==========================================

export async function updateViewingStatus(
  viewingId: string,
  status: ViewingStatus,
  agentId?: string
) {
  const viewing = await prisma.viewing.findUnique({
    where: { id: viewingId },
  })

  if (!viewing) {
    throw new AppError(404, 'Viewing not found')
  }

  if (viewing.agentId !== agentId) {
    throw new AppError(403, 'You do not have permission to update this viewing')
  }

  const updateData: Record<string, unknown> = { status }

  if (status === 'COMPLETED') {
    updateData.completedAt = new Date()
  }

  const updatedViewing = await prisma.viewing.update({
    where: { id: viewingId },
    data: updateData,
  })

  logger.info(`Viewing status updated: ${viewingId} to ${status} by agent ${agentId}`)

  return toViewingDTO(updatedViewing)
}
