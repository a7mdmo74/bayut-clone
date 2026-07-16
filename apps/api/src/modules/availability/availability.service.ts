import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'

interface AvailabilityInput {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive?: boolean
}

export async function setAvailability(agentId: string, slots: AvailabilityInput[]) {
  // Verify agent exists
  const agent = await prisma.agent.findUnique({ where: { userId: agentId } })
  if (!agent) throw new AppError(404, 'Agent not found')

  // Delete existing and recreate
  await prisma.agentAvailability.deleteMany({ where: { agentId: agent.id } })

  if (slots.length === 0) return []

  return prisma.agentAvailability.createMany({
    data: slots.map(slot => ({
      agentId: agent.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive ?? true,
    })),
  })
}

export async function getAvailability(agentId: string) {
  const agent = await prisma.agent.findUnique({ where: { userId: agentId } })
  if (!agent) throw new AppError(404, 'Agent not found')

  return prisma.agentAvailability.findMany({
    where: { agentId: agent.id },
    orderBy: { dayOfWeek: 'asc' },
  })
}

export async function getPublicAvailability(agentId: string) {
  return prisma.agentAvailability.findMany({
    where: { agentId, isActive: true },
    orderBy: { dayOfWeek: 'asc' },
  })
}
