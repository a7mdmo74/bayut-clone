import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertySearchQuery,
  PaginationQuery,
  PropertyDTO,
} from '@repo/types'
import { toPropertyDTO } from '../../lib/propertyMapper'
import { sendEmail } from '../../lib/email'
import { logSearch } from '../analytics/analytics.service'

// Slugify a title into a URL-safe string, e.g. "2BR Marina View" -> "2br-marina-view"
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function createProperty(ownerId: string, input: CreatePropertyInput) {
  const baseSlug = slugify(input.title)
  // append a short random suffix so two "Marina View" listings don't collide
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`

  // Prevent duplicate active listings with the same title for the same agent
  const existingProperty = await prisma.property.findFirst({
    where: {
      ownerId,
      title: input.title,
      status: { notIn: ['REJECTED', 'EXPIRED'] },
    },
  })
  if (existingProperty) {
    throw new AppError(409, 'You already have an active listing with this title')
  }

  const { amenityIds, ...propertyData } = input

  const agent = await prisma.agent.findUnique({ where: { userId: ownerId } })

  const property = await prisma.property.create({
    data: {
      ...propertyData,
      slug,
      ownerId,
      agentId: agent?.id,
      status: 'ACTIVE',
      publishedAt: new Date(),
      amenities: amenityIds ? { create: amenityIds.map(amenityId => ({ amenityId })) } : undefined,
    },
    include: { images: true, amenities: { include: { amenity: true } }, community: { include: { emirate: true } } },
  })

  // Fire-and-forget: check saved search alerts
  checkSavedSearchAlerts(property).catch(err => {
    logger.error({ err, propertyId: property.id }, 'Failed to check saved search alerts')
  })

  return toPropertyDTO(property)
}

export async function checkSavedSearchAlerts(property: any) {
  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { alertsOn: true },
      include: { user: true },
    })

    for (const saved of savedSearches) {
      const filters = (saved.filters as Record<string, any>) || {}
      let matches = true

      if (filters.listingType && filters.listingType !== property.listingType) matches = false
      if (filters.propertyType && filters.propertyType !== property.propertyType) matches = false
      if (filters.bedrooms !== undefined && filters.bedrooms !== null) {
        if (property.bedrooms === null || property.bedrooms < filters.bedrooms) matches = false
      }
      if (filters.bathrooms !== undefined && filters.bathrooms !== null) {
        if (property.bathrooms === null || property.bathrooms < filters.bathrooms) matches = false
      }
      if (filters.minPrice !== undefined && Number(property.price) < filters.minPrice) matches = false
      if (filters.maxPrice !== undefined && Number(property.price) > filters.maxPrice) matches = false

      if (matches) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
        sendEmail({
          to: saved.user.email,
          subject: `New Property Match: ${property.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hello ${saved.user.firstName},</h2>
              <p>A new property matches your saved search "<strong>${saved.name}</strong>":</p>
              <p><strong>${property.title}</strong> — AED ${Number(property.price).toLocaleString()}</p>
              <a href="${frontendUrl}/properties/${property.slug}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Property</a>
              <p>Best regards,<br>Bayara Real Estate Team</p>
            </div>
          `,
        }).catch(err => {
          logger.error({ err, savedSearchId: saved.id }, 'Failed to send saved search alert')
        })
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error checking saved search alerts')
  }
}

async function withDbRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation()
    } catch (err) {
      lastError = err
      const code = (err as { code?: string }).code
      const retryable = code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'P1001' || code === 'P1008'
      if (!retryable || attempt === attempts) break
      const delayMs = attempt * 1000
      logger.warn({ code, attempt, delayMs }, 'Transient DB error — retrying')
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw lastError
}

export async function getPropertyBySlug(slug: string) {
  const property = await withDbRetry(() =>
    prisma.property.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
        community: { include: { emirate: true } },
        agent: { include: { user: true } },
      },
    })
  )

  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  // fire-and-forget view count increment — don't block the response on this
  prisma.property
    .update({
      where: { id: property.id },
      data: { viewsCount: { increment: 1 } },
    })
    .catch((err: any) => logger.error('Failed to increment view count:', err))

  return toPropertyDTO(property)
}

export async function searchProperties(filters: PropertySearchQuery, pagination: PaginationQuery) {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  // Build the where clause with conditional spreads
  const where = {
    status: 'ACTIVE' as const,
    ...(filters.listingType && { listingType: filters.listingType }),
    ...(filters.propertyType && { propertyType: filters.propertyType }),
    ...(filters.communityId && { communityId: filters.communityId }),
    ...(filters.bedrooms !== undefined && { bedrooms: filters.bedrooms }),
    ...(filters.bathrooms !== undefined && { bathrooms: filters.bathrooms }),
    ...(filters.furnished !== undefined && { furnished: filters.furnished }),
    ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      price: {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      },
    }),
    ...(filters.keyword && {
      OR: [
        { title: { contains: filters.keyword, mode: 'insensitive' as const } },
        { description: { contains: filters.keyword, mode: 'insensitive' as const } },
      ],
    }),
  }

  // Build orderBy based on sortBy parameter
  let orderBy: any = { createdAt: 'desc' } // default
  if (filters.sortBy === 'price_asc') {
    orderBy = { price: 'asc' }
  } else if (filters.sortBy === 'price_desc') {
    orderBy = { price: 'desc' }
  } else if (filters.sortBy === 'newest') {
    orderBy = { createdAt: 'desc' }
  }

  const [data, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        images: { where: { isCover: true }, take: 1 },
        community: { include: { emirate: true } },
      },
    }),
    prisma.property.count({ where }),
  ])

  // Fire-and-forget: log search for analytics
  logSearch({
    query: filters.keyword || undefined,
    filters: filters as Record<string, any>,
    resultCount: total,
  }).catch(() => {})

  return {
    data: data.map(toPropertyDTO),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getFeaturedProperties(limit = 6) {
  const properties = await prisma.property.findMany({
    where: { status: 'ACTIVE', isFeatured: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      images: { where: { isCover: true }, take: 1 },
      community: { include: { emirate: true } },
    },
  })
  return properties.map(toPropertyDTO)
}

export async function updateProperty(
  propertyId: string,
  userId: string,
  userRole: string,
  input: UpdatePropertyInput
) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  const isOwner = property.ownerId === userId
  const isAdmin = userRole === 'ADMIN'
  if (!isOwner && !isAdmin) {
    throw new AppError(403, 'You do not have permission to edit this property')
  }

  const { amenityIds, ...updateData } = input

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...updateData,
      ...(amenityIds && {
        amenities: {
          deleteMany: {},
          create: amenityIds.map(amenityId => ({ amenityId })),
        },
      }),
    },
    include: { images: true, amenities: { include: { amenity: true } }, community: { include: { emirate: true } } },
  })

  return toPropertyDTO(updated)
}

export async function deleteProperty(propertyId: string, userId: string, userRole: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  const isOwner = property.ownerId === userId
  const isAdmin = userRole === 'ADMIN'
  if (!isOwner && !isAdmin) {
    throw new AppError(403, 'You do not have permission to delete this property')
  }

  await prisma.property.delete({ where: { id: propertyId } })
}

export async function addPropertyImage(
  propertyId: string,
  userId: string,
  url: string,
  isCover = false
) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) throw new AppError(404, 'Property not found')
  if (property.ownerId !== userId) throw new AppError(403, 'You do not own this property')

  return prisma.propertyImage.create({
    data: { propertyId, url, isCover },
  })
}
