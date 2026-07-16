import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { viewingStatusSchema } from '@repo/types'
import * as viewingsService from './viewings.service'

// Request viewing schema
const requestViewingSchema = z.object({
  propertyId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
})

// Cancel viewing schema
const cancelViewingSchema = z.object({
  reason: z.string().optional(),
})

// Update viewing status schema (for agents)
const updateViewingStatusSchema = z.object({
  status: viewingStatusSchema,
})

export async function request(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const parsed = requestViewingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const result = await viewingsService.requestViewing(
    req.user.userId,
    parsed.data.propertyId,
    new Date(parsed.data.scheduledAt)
  )
  res.status(201).json(result)
}

export async function getMyViewings(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const viewings = await viewingsService.getMyViewings(req.user.userId)
  res.json(viewings)
}

export async function getAgentViewings(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const viewings = await viewingsService.getAgentViewings(req.user.userId)
  res.json(viewings)
}

export async function getOne(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const viewingId = req.params.id
  if (!viewingId) {
    return res.status(400).json({ error: 'Viewing ID is required' })
  }

  const role = req.user.role ?? 'BUYER'
  const viewing = await viewingsService.getViewing(viewingId, req.user.userId, role)
  res.json(viewing)
}

export async function cancel(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const viewingId = req.params.id
  if (!viewingId) {
    return res.status(400).json({ error: 'Viewing ID is required' })
  }

  const parsed = cancelViewingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const role = req.user.role ?? 'BUYER'
  const result = await viewingsService.cancelViewing(
    viewingId,
    req.user.userId,
    role,
    parsed.data.reason
  )
  res.json(result)
}

export async function updateStatus(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const viewingId = req.params.id
  if (!viewingId) {
    return res.status(400).json({ error: 'Viewing ID is required' })
  }

  const parsed = updateViewingStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  // Get agent ID from user
  const agent = await prisma.agent.findUnique({
    where: { userId: req.user.userId },
  })

  if (!agent) {
    return res.status(403).json({ error: 'Agent profile not found' })
  }

  const viewing = await viewingsService.updateViewingStatus(
    viewingId,
    parsed.data.status,
    agent.id
  )
  res.json(viewing)
}
