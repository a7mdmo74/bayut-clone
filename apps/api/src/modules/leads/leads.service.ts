import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { CreateLeadInput, UpdateLeadStatusInput } from '@repo/types'

export async function createLead(input: CreateLeadInput, senderId?: string) {
  // Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
  })
  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  return prisma.lead.create({
    data: {
      propertyId: input.propertyId,
      senderId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      sender: senderId
        ? {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          }
        : false,
    },
  })
}

export async function getLeadsForAgent(userId: string, userRole: string) {
  // ADMIN can see all leads, AGENT/AGENCY_ADMIN only see leads for their properties
  const where =
    userRole === 'ADMIN'
      ? {}
      : {
          property: {
            ownerId: userId,
          },
        }

  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      sender: {
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

export async function updateLeadStatus(
  leadId: string,
  userId: string,
  userRole: string,
  input: UpdateLeadStatusInput
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { property: true },
  })

  if (!lead) {
    throw new AppError(404, 'Lead not found')
  }

  // Check permissions: ADMIN can update any lead, AGENT/AGENCY_ADMIN only their property's leads
  const isOwner = lead.property.ownerId === userId
  const isAdmin = userRole === 'ADMIN'

  if (!isOwner && !isAdmin) {
    throw new AppError(403, 'You do not have permission to update this lead')
  }

  return prisma.lead.update({
    where: { id: leadId },
    data: { status: input.status },
  })
}
