import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { CreateLeadInput, UpdateLeadStatusInput } from '@repo/types'
import { sendNewLeadEmail } from '../../lib/email'
import { logger } from '../../lib/logger'

export async function createLead(input: CreateLeadInput, senderId?: string) {
  // Verify property exists and get owner info
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
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
  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  const lead = await prisma.lead.create({
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

  // Send email notification to property owner (fire-and-forget with error logging)
  sendNewLeadEmail({
    agentEmail: property.owner.email,
    agentName: property.owner.firstName,
    propertyTitle: property.title,
    leadName: input.name,
    leadEmail: input.email,
    leadPhone: input.phone,
    leadMessage: input.message || 'No message provided',
    locale: 'ar', // Default to Arabic, would ideally come from user preference
  }).catch(error => {
    logger.error({ error, leadId: lead.id, propertyId: input.propertyId }, 'Failed to send new lead email')
  })

  return lead
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

  const leads = await prisma.lead.findMany({
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
          phone: true,
        },
      },
    },
  })

  return {
    leads: leads.map(lead => ({
      id: lead.id,
      propertyTitle: lead.property.title,
      propertySlug: lead.property.slug,
      senderName: lead.sender
        ? `${lead.sender.firstName} ${lead.sender.lastName}`
        : lead.name,
      senderEmail: lead.sender?.email || lead.email,
      senderPhone: lead.sender?.phone || lead.phone,
      message: lead.message,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
    })),
  }
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

export async function getLeadsForUser(userId: string) {
  return prisma.lead.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  })
}
