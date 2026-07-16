import type { Request, Response } from 'express'
import * as reviewsService from './reviews.service'

export async function createReview(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const { agentId, rating, comment } = req.body
  if (!agentId || typeof rating !== 'number') {
    return res.status(400).json({ error: 'agentId and rating are required' })
  }

  const review = await reviewsService.createReview({
    agentId,
    userId: req.user.userId,
    rating,
    comment,
  })

  res.status(201).json(review)
}

export async function getAgentReviews(req: Request, res: Response) {
  const agentId = req.params.agentId as string
  const result = await reviewsService.getAgentReviews(agentId)
  res.json(result)
}

export async function deleteReview(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const id = req.params.id as string
  await reviewsService.deleteReview(id, req.user.userId)
  res.json({ success: true })
}
