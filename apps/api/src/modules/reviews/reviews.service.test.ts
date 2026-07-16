import { describe, it, expect, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    agentReview: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'r1', rating: 5 }),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn().mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }),
    },
    agent: { findUnique: vi.fn() },
  },
}))

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }))

import * as reviewsService from './reviews.service'

describe('Reviews Service', () => {
  it('createReview should throw 400 for invalid rating', async () => {
    await expect(
      reviewsService.createReview({ agentId: 'a1', userId: 'u1', rating: 6 })
    ).rejects.toThrow('between 1 and 5')
  })

  it('createReview should create new review', async () => {
    mockPrisma.agentReview.findUnique.mockResolvedValue(null)
    mockPrisma.agent.findUnique.mockResolvedValue({ id: 'a1' })
    const result = await reviewsService.createReview({ agentId: 'a1', userId: 'u1', rating: 5, comment: 'Great!' })
    expect(result).toHaveProperty('id', 'r1')
  })

  it('createReview should update existing review', async () => {
    mockPrisma.agentReview.findUnique.mockResolvedValue({ id: 'existing', userId: 'u1' })
    await reviewsService.createReview({ agentId: 'a1', userId: 'u1', rating: 4 })
    expect(mockPrisma.agentReview.update).toHaveBeenCalled()
  })

  it('getAgentReviews should return stats', async () => {
    const result = await reviewsService.getAgentReviews('a1')
    expect(result.totalReviews).toBe(0)
  })

  it('deleteReview should throw 404 if not found', async () => {
    mockPrisma.agentReview.findUnique.mockResolvedValue(null)
    await expect(reviewsService.deleteReview('none', 'u1')).rejects.toThrow('not found')
  })

  it('deleteReview should throw 403 if not owner', async () => {
    mockPrisma.agentReview.findUnique.mockResolvedValue({ id: 'r1', userId: 'other' })
    await expect(reviewsService.deleteReview('r1', 'u1')).rejects.toThrow('Not authorized')
  })
})
