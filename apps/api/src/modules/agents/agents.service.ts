import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { ApplyForAgentInput } from '@repo/types'
import { sendAgentApplicationEmail } from '../../lib/email'
import { logger } from '../../lib/logger'

export async function getDashboardStats(agentId: string) {
  const [activeListings, totalViews, inquiries, leadCredits] = await Promise.all([
    prisma.property.count({ where: { ownerId: agentId, status: 'ACTIVE' } }),
    prisma.property.aggregate({
      where: { ownerId: agentId },
      _sum: { viewsCount: true },
    }),
    prisma.lead.count({ where: { property: { ownerId: agentId } } }),
    prisma.subscription.findFirst({
      where: {
        agentId: agentId,
        status: 'ACTIVE',
        currentPeriodEnd: { gte: new Date() }
      },
      include: { plan: true }
    }),
  ])

  return {
    activeListings,
    totalViews: totalViews._sum.viewsCount || 0,
    inquiries,
    leadCredits: leadCredits?.plan?.maxListings || 0,
  }
}

export async function getAgentProperties(agentId: string) {
  const properties = await prisma.property.findMany({
    where: { ownerId: agentId },
    include: {
      images: { where: { isCover: true }, take: 1 },
      community: { include: { emirate: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return properties.map(property => ({
    id: property.id,
    title: property.title,
    slug: property.slug,
    type: property.propertyType,
    price: Number(property.price),
    status: property.status,
    location: property.community?.name || 'Unknown',
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft ? Number(property.areaSqft) : null,
    createdAt: property.createdAt.toISOString(),
    views: property.viewsCount,
    inquiries: 0, // Would need to aggregate from leads table
    images: property.images?.map((img: any) => img.url) || [],
  }))
}

export async function applyForAgent(userId: string, input: ApplyForAgentInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.role === 'AGENT' || user.role === 'AGENCY_ADMIN') {
    throw new AppError(400, 'You are already an agent')
  }

  const existing = await prisma.agentApplication.findUnique({ where: { userId } })
  if (existing && existing.status === 'PENDING') {
    throw new AppError(409, 'You already have a pending application')
  }

  // upsert: create a fresh application, or overwrite a previously rejected one
  return prisma.agentApplication.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { ...input, status: 'PENDING', reviewedBy: null, reviewedAt: null },
  })
}

export async function listApplications(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return prisma.agentApplication.findMany({
    where: status ? { status } : undefined,
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function reviewApplication(
  applicationId: string,
  adminId: string,
  decision: 'APPROVED' | 'REJECTED'
) {
  const application = await prisma.agentApplication.findUnique({ 
    where: { id: applicationId },
    include: { user: true }
  })
  if (!application) throw new AppError(404, 'Application not found')
  if (application.status !== 'PENDING') throw new AppError(400, 'Application already reviewed')

  // a transaction: either both updates succeed, or neither does —
  // you never want an approved application without an actual Agent record existing
  const result = await prisma.$transaction(async (tx: any) => {
    const updatedApplication = await tx.agentApplication.update({
      where: { id: applicationId },
      data: { status: decision, reviewedBy: adminId, reviewedAt: new Date() },
    })

    if (decision === 'APPROVED') {
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'AGENT' },
      })

      await tx.agent.create({
        data: {
          userId: application.userId,
          licenseNo: application.licenseNo,
          bio: application.bio,
          languages: application.languages,
          agencyId: application.agencyId,
        },
      })
    }

    return updatedApplication
  })

  // Send email notification (fire-and-forget with error logging)
  sendAgentApplicationEmail({
    agentEmail: application.user.email,
    agentName: application.user.firstName,
    locale: 'ar', // Default to Arabic, would ideally come from user preference
    decision,
  }).catch(error => {
    logger.error({ error, applicationId, decision }, 'Failed to send agent application email')
  })

  return result
}

export async function getPublicAgentProfile(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        }
      },
      agency: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          licenseNo: true,
        }
      },
      properties: {
        where: { status: 'ACTIVE' },
        include: {
          images: { where: { isCover: true }, take: 1 },
          community: { include: { emirate: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }
    }
  })

  if (!agent) return null

  return {
    id: agent.id,
    licenseNo: agent.licenseNo,
    bio: agent.bio,
    languages: agent.languages,
    user: agent.user,
    agency: agent.agency,
    properties: agent.properties.map(property => ({
      id: property.id,
      title: property.title,
      slug: property.slug,
      type: property.propertyType,
      price: Number(property.price),
      status: property.status,
      location: property.community?.name || 'Unknown',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft ? Number(property.areaSqft) : null,
      images: property.images?.map((img: any) => img.url) || [],
    }))
  }
}

export async function getAgentProfile(userId: string) {
  const agent = await prisma.agent.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        }
      },
      agency: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          licenseNo: true,
        }
      },
    }
  })

  if (!agent) return null

  return {
    id: agent.id,
    licenseNo: agent.licenseNo,
    bio: agent.bio,
    languages: agent.languages,
    user: agent.user,
    agency: agent.agency,
  }
}

export async function updateAgentProfile(userId: string, data: { bio?: string; languages?: string[] }) {
  const agent = await prisma.agent.findUnique({ where: { userId } })
  if (!agent) throw new AppError(404, 'Agent profile not found')

  const updatedAgent = await prisma.agent.update({
    where: { userId },
    data: {
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.languages !== undefined && { languages: data.languages }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        }
      },
      agency: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          licenseNo: true,
        }
      },
    }
  })

  return {
    id: updatedAgent.id,
    licenseNo: updatedAgent.licenseNo,
    bio: updatedAgent.bio,
    languages: updatedAgent.languages,
    user: updatedAgent.user,
    agency: updatedAgent.agency,
  }
}
