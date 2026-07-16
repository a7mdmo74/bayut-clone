import type { Request, Response } from 'express'
import { updateProfileSchema, changePasswordSchema } from '@repo/types'
import * as usersService from './users.service'

export async function getProfile(req: Request, res: Response) {
  const user = await usersService.getUserProfile(req.user!.userId)
  res.json(user)
}

export async function updateProfile(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }
  const user = await usersService.updateUserProfile(req.user!.userId, parsed.data)
  res.json(user)
}

export async function changePassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }
  await usersService.changeUserPassword(req.user!.userId, parsed.data)
  res.json({ success: true })
}