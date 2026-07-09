import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { CreateAmenityInput } from '@repo/types'

export async function getAllAmenities() {
  return prisma.amenity.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function createAmenity(input: CreateAmenityInput) {
  // Check for duplicate name
  const existing = await prisma.amenity.findUnique({
    where: { name: input.name },
  })
  if (existing) {
    throw new AppError(409, 'An amenity with this name already exists')
  }

  return prisma.amenity.create({
    data: input,
  })
}
