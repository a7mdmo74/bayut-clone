import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'

export async function logSearch(params: {
  userId?: string
  query?: string
  filters?: Record<string, any>
  resultCount: number
}) {
  try {
    await prisma.searchLog.create({
      data: {
        userId: params.userId || undefined,
        query: params.query || undefined,
        filters: params.filters || undefined,
        resultCount: params.resultCount,
      },
    })
  } catch (err) {
    logger.error({ err }, 'Failed to log search')
  }
}

export async function getPopularSearches(limit = 10) {
  const results = await prisma.searchLog.groupBy({
    by: ['query'],
    _count: { query: true },
    where: { query: { not: null } },
    orderBy: { _count: { query: 'desc' } },
    take: limit,
  })

  return results
    .filter(r => r.query)
    .map(r => ({ query: r.query!, count: r._count.query }))
}

export async function getSearchStats() {
  const [totalSearches, todaySearches, uniqueUsers] = await Promise.all([
    prisma.searchLog.count(),
    prisma.searchLog.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.searchLog.findMany({
      where: { userId: { not: null } },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ])

  return {
    totalSearches,
    todaySearches,
    uniqueSearchers: uniqueUsers.length,
  }
}

export async function getRecentSearches(limit = 20) {
  return prisma.searchLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, firstName: true, email: true },
      },
    },
  })
}
