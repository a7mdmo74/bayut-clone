import type { Request, Response } from 'express'
import { updateUserStatusSchema, paginationQuerySchema } from '@repo/types'
import * as adminService from './admin.service'

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

  const user = await adminService.updateUserStatus(req.params.id!, parsed.data)
  res.json(user)
}

export async function listPendingProperties(req: Request, res: Response) {
  const properties = await adminService.getPendingProperties()
  res.json(properties)
}
