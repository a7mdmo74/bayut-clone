import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'

export async function getAllEmirates() {
  return prisma.emirate.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getCommunitiesByEmirate(emirateId: string) {
  const emirate = await prisma.emirate.findUnique({
    where: { id: emirateId },
  })
  if (!emirate) {
    throw new AppError(404, 'Emirate not found')
  }

  return prisma.community.findMany({
    where: { emirateId },
    orderBy: { name: 'asc' },
  })
}

export async function getSubCommunitiesByCommunity(communityId: string) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
  })
  if (!community) {
    throw new AppError(404, 'Community not found')
  }

  return prisma.subCommunity.findMany({
    where: { communityId },
    orderBy: { name: 'asc' },
  })
}
