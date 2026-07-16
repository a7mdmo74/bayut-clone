import type { Request, Response } from 'express'
import * as availabilityService from './availability.service'

export async function setAvailability(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const { slots } = req.body
  if (!Array.isArray(slots)) {
    return res.status(400).json({ error: 'slots array is required' })
  }

  await availabilityService.setAvailability(req.user.userId, slots)
  const result = await availabilityService.getAvailability(req.user.userId)
  res.json(result)
}

export async function getAvailability(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const result = await availabilityService.getAvailability(req.user.userId)
  res.json(result)
}

export async function getPublicAvailability(req: Request, res: Response) {
  const { agentId } = req.params
  const result = await availabilityService.getPublicAvailability(agentId as string)
  res.json(result)
}
