import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertySearchQuery,
  PaginationQuery,
} from '@repo/types'

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

  const { amenityIds, ...propertyData } = input

  const property = await prisma.property.create({
    data: {
      ...propertyData,
      slug,
      ownerId,
      amenities: amenityIds ? { create: amenityIds.map(amenityId => ({ amenityId })) } : undefined,
    },
    include: { images: true, amenities: { include: { amenity: true } }, community: true },
  })

  return property
}

export async function getPropertyBySlug(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: 'asc' } },
      amenities: { include: { amenity: true } },
      community: { include: { emirate: true } },
      agent: { include: { user: true } },
    },
  })

  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  // fire-and-forget view count increment — don't block the response on this
  prisma.property
    .update({
      where: { id: property.id },
      data: { viewsCount: { increment: 1 } },
    })
    .catch(err => logger.error('Failed to increment view count:', err))

  return property
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
        community: true,
      },
    }),
    prisma.property.count({ where }),
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

  return prisma.property.update({
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
  })
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
