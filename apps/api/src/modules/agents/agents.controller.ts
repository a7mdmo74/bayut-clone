import type { Request, Response } from 'express'
import { applyForAgentSchema, reviewApplicationSchema } from '@repo/types'
import * as agentsService from './agents.service'

export async function apply(req: Request, res: Response) {
  const parsed = applyForAgentSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }
  const application = await agentsService.applyForAgent(req.user!.userId, parsed.data)
  res.status(201).json(application)
}

export async function list(req: Request, res: Response) {
  const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined
  const applications = await agentsService.listApplications(status)
  res.json(applications)
}

export async function review(req: Request, res: Response) {
  const parsed = reviewApplicationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }
  const result = await agentsService.reviewApplication(
    req.params.id!,
    req.user!.userId,
    parsed.data.decision
  )
  res.json(result)
}
