import type { Request, Response } from 'express'
import { registerSchema, loginSchema } from '@repo/types'
import * as authService from './auth.service'

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const tokens = await authService.registerUser(parsed.data)
  res.status(201).json(tokens)
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const tokens = await authService.loginUser(parsed.data)
  res.json(tokens)
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' })
  }

  const tokens = await authService.refreshAccessToken(refreshToken)
  res.json(tokens)
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body
  if (refreshToken) {
    await authService.logoutUser(refreshToken)
  }
  res.status(204).send()
}
