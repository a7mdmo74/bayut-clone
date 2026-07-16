import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface CreateAgencyInput {
  name: string
  description?: string
  phone?: string
  email?: string
  website?: string
  licenseNo?: string
  logoUrl?: string
}

interface UpdateAgencyInput extends Partial<CreateAgencyInput> {}

export async function createAgency(input: CreateAgencyInput) {
  const slug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 7)}`

  if (input.licenseNo) {
    const existing = await prisma.agency.findUnique({ where: { licenseNo: input.licenseNo } })
    if (existing) throw new AppError(409, 'Agency with this license number already exists')
  }

  return prisma.agency.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      phone: input.phone,
      email: input.email,
      website: input.website,
      licenseNo: input.licenseNo,
      logoUrl: input.logoUrl,
    },
  })
}

export async function getAgencies(page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    prisma.agency.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { agents: true, properties: true } } },
    }),
    prisma.agency.count(),
  ])

  return {
    data: data.map(a => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      logoUrl: a.logoUrl,
      description: a.description,
      phone: a.phone,
      email: a.email,
      website: a.website,
      licenseNo: a.licenseNo,
      isVerified: a.isVerified,
      agentCount: a._count.agents,
      propertyCount: a._count.properties,
      createdAt: a.createdAt,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getAgencyById(id: string) {
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      agents: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
      },
      _count: { select: { properties: true } },
    },
  })

  if (!agency) throw new AppError(404, 'Agency not found')
  return agency
}

export async function updateAgency(id: string, input: UpdateAgencyInput) {
  const agency = await prisma.agency.findUnique({ where: { id } })
  if (!agency) throw new AppError(404, 'Agency not found')

  if (input.licenseNo && input.licenseNo !== agency.licenseNo) {
    const existing = await prisma.agency.findUnique({ where: { licenseNo: input.licenseNo } })
    if (existing) throw new AppError(409, 'Agency with this license number already exists')
  }

  return prisma.agency.update({
    where: { id },
    data: input,
  })
}

export async function verifyAgency(id: string) {
  const agency = await prisma.agency.findUnique({ where: { id } })
  if (!agency) throw new AppError(404, 'Agency not found')

  return prisma.agency.update({
    where: { id },
    data: { isVerified: true },
  })
}

export async function deleteAgency(id: string) {
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: { _count: { select: { agents: true, properties: true } } },
  })
  if (!agency) throw new AppError(404, 'Agency not found')
  if (agency._count.agents > 0) {
    throw new AppError(400, 'Cannot delete agency with assigned agents')
  }

  await prisma.agency.delete({ where: { id } })
}
