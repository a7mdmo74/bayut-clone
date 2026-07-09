import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import type { ApplyForAgentInput } from '@repo/types'

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
  const application = await prisma.agentApplication.findUnique({ where: { id: applicationId } })
  if (!application) throw new AppError(404, 'Application not found')
  if (application.status !== 'PENDING') throw new AppError(400, 'Application already reviewed')

  // a transaction: either both updates succeed, or neither does —
  // you never want an approved application without an actual Agent record existing
  return prisma.$transaction(async tx => {
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
}
