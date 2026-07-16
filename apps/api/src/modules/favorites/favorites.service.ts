import { prisma } from '../../lib/prisma'
import { toPropertyDTO } from '../../lib/propertyMapper'
import { AppError } from '../../utils/AppError'
import type { PaginationQuery } from '@repo/types'

function toFavoriteDTO(favorite: any) {
  return {
    id: favorite.id,
    propertyId: favorite.propertyId,
    property: toPropertyDTO(favorite.property),
    createdAt: favorite.createdAt.toISOString(),
  }
}

export async function addFavorite(userId: string, propertyId: string) {
  // Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })
  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  // Idempotent: if already favorited, return existing
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },
  })

  if (existing) {
    return getFavoriteById(existing.id)
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId,
      propertyId,
    },
    include: {
      property: {
        include: {
          images: { take: 1, orderBy: { isCover: 'desc' } },
          community: { include: { emirate: true } },
        },
      },
    },
  })

  return toFavoriteDTO(favorite)
}

export async function removeFavorite(userId: string, propertyId: string) {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },
  })

  if (!favorite) {
    throw new AppError(404, 'Favorite not found')
  }

  await prisma.favorite.delete({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },
  })
}

export async function getUserFavorites(userId: string, pagination: PaginationQuery) {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: { take: 1, orderBy: { isCover: 'desc' } },
            community: { include: { emirate: true } },
          },
        },
      },
    }),
    prisma.favorite.count({ where: { userId } }),
  ])

  return {
    data: data.map(toFavoriteDTO),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

async function getFavoriteById(id: string) {
  const favorite = await prisma.favorite.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          images: { take: 1, orderBy: { isCover: 'desc' } },
          community: { include: { emirate: true } },
        },
      },
    },
  })

  return favorite ? toFavoriteDTO(favorite) : null
}
