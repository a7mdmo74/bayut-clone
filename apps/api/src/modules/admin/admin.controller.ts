import type { Request, Response } from 'express'
import {
  updateUserStatusSchema,
  paginationQuerySchema,
  reviewPropertyStatusSchema,
} from '@repo/types'
import * as adminService from './admin.service'

export async function getDashboardStats(req: Request, res: Response) {
  const stats = await adminService.getDashboardStats()
  res.json(stats)
}

export async function getRecentActivity(req: Request, res: Response) {
  const activities = await adminService.getRecentActivity()
  res.json(activities)
}

export async function listUsers(req: Request, res: Response) {
  const parsed = paginationQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const result = await adminService.getAllUsers(parsed.data)
  res.json(result)
}

export async function updateUserStatus(req: Request, res: Response) {
  const parsed = updateUserStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const user = await adminService.updateUserStatus(req.params.id!, parsed.data, req.user!.userId, req.ip)
  res.json(user)
}

export async function reviewPropertyStatus(req: Request, res: Response) {
  const parsed = reviewPropertyStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const property = await adminService.reviewPropertyStatus(req.params.id!, parsed.data, req.user!.userId, req.ip)
  res.json(property)
}

export async function listPendingProperties(req: Request, res: Response) {
  const properties = await adminService.getPendingProperties()
  res.json(properties)
}
