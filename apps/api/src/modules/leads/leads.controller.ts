import type { Request, Response } from 'express'
import { createLeadSchema, updateLeadStatusSchema } from '@repo/types'
import { verifyAccessToken } from '../../modules/auth/token.util'
import * as leadsService from './leads.service'

export async function create(req: Request, res: Response) {
  const parsed = createLeadSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  // Optional auth: try to get user from token if present, but don't fail if absent
  let senderId: string | undefined
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1]
      const payload = verifyAccessToken(token)
      senderId = payload.userId
    } catch {
      // Token invalid or expired — proceed as guest
      senderId = undefined
    }
  }

  const lead = await leadsService.createLead(parsed.data, senderId)
  res.status(201).json(lead)
}

export async function list(req: Request, res: Response) {
  const leads = await leadsService.getLeadsForAgent(req.user!.userId, req.user!.role)
  res.json(leads)
}

export async function updateStatus(req: Request, res: Response) {
  const parsed = updateLeadStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const lead = await leadsService.updateLeadStatus(
    req.params.id!,
    req.user!.userId,
    req.user!.role,
    parsed.data
  )
  res.json(lead)
}
