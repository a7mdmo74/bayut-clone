import type { Request, Response } from 'express'
import { applyForAgentSchema } from '@repo/types'
import * as agentsService from './agents.service'

export async function getDashboardStats(req: Request, res: Response) {
  const stats = await agentsService.getDashboardStats(req.user!.userId)
  res.json(stats)
}

export async function getProperties(req: Request, res: Response) {
  const properties = await agentsService.getAgentProperties(req.user!.userId)
  res.json({ properties })
}

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
  const { decision } = req.body
  if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' })
  }
  const result = await agentsService.reviewApplication(
    req.params.id!,
    req.user!.userId,
    decision as 'APPROVED' | 'REJECTED'
  )
  res.json(result)
}

export async function getPublicProfile(req: Request, res: Response) {
  const agent = await agentsService.getPublicAgentProfile(req.params.id!)
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' })
  }
  res.json(agent)
}

export async function getAgentProfile(req: Request, res: Response) {
  const agent = await agentsService.getAgentProfile(req.user!.userId)
  if (!agent) {
    return res.status(404).json({ error: 'Agent profile not found' })
  }
  res.json(agent)
}

export async function updateAgentProfile(req: Request, res: Response) {
  const { bio, languages } = req.body
  const agent = await agentsService.updateAgentProfile(req.user!.userId, { bio, languages })
  res.json(agent)
}
