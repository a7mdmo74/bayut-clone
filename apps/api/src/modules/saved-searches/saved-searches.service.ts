import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { CreateSavedSearchInput } from '@repo/types'

export async function createSavedSearch(userId: string, input: CreateSavedSearchInput) {
  return prisma.savedSearch.create({
    data: {
      userId,
      name: input.name,
      filters: input.filters as any, // store as JSON
      alertsOn: true,
    },
  })
}

export async function getUserSavedSearches(userId: string) {
  return prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deleteSavedSearch(id: string, userId: string) {
  const savedSearch = await prisma.savedSearch.findUnique({
    where: { id },
  })

  if (!savedSearch) {
    throw new AppError(404, 'Saved search not found')
  }

  if (savedSearch.userId !== userId) {
    throw new AppError(403, 'You do not have permission to delete this saved search')
  }

  await prisma.savedSearch.delete({
    where: { id },
  })
}
