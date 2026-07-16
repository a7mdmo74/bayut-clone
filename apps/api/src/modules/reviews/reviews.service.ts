import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'

interface CreateReviewInput {
  agentId: string
  userId: string
  rating: number
  comment?: string
}

export async function createReview(input: CreateReviewInput) {
  if (input.rating < 1 || input.rating > 5) {
    throw new AppError(400, 'Rating must be between 1 and 5')
  }

  // Check if user has already reviewed this agent
  const existing = await prisma.agentReview.findUnique({
    where: {
      agentId_userId: { agentId: input.agentId, userId: input.userId },
    },
  })

  if (existing) {
    // Update existing review
    return prisma.agentReview.update({
      where: { id: existing.id },
      data: { rating: input.rating, comment: input.comment },
    })
  }

  // Verify agent exists
  const agent = await prisma.agent.findUnique({ where: { id: input.agentId } })
  if (!agent) throw new AppError(404, 'Agent not found')

  return prisma.agentReview.create({
    data: {
      agentId: input.agentId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
    },
  })
}

export async function getAgentReviews(agentId: string) {
  const reviews = await prisma.agentReview.findMany({
    where: { agentId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const avgResult = await prisma.agentReview.aggregate({
    where: { agentId },
    _avg: { rating: true },
    _count: { rating: true },
  })

  return {
    reviews,
    averageRating: avgResult._avg.rating || 0,
    totalReviews: avgResult._count.rating,
  }
}

export async function deleteReview(reviewId: string, userId: string) {
  const review = await prisma.agentReview.findUnique({ where: { id: reviewId } })
  if (!review) throw new AppError(404, 'Review not found')
  if (review.userId !== userId) throw new AppError(403, 'Not authorized')

  await prisma.agentReview.delete({ where: { id: reviewId } })
}
