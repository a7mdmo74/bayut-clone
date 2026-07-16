import type { Request, Response } from 'express'
import { registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema } from '@repo/types'
import * as authService from './auth.service'

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.userId)
  res.json(user)
}

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

export async function forgotPassword(req: Request, res: Response) {
  const parsed = requestPasswordResetSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }
  // Always return success to avoid email enumeration
  await authService.requestPasswordReset(parsed.data.email)
  res.json({ success: true, message: 'If the email exists, a reset link has been sent' })
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }
  await authService.resetPassword(parsed.data.token, parsed.data.newPassword)
  res.json({ success: true })
}

export async function sendVerification(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  await authService.sendVerificationEmail(req.user.userId)
  res.json({ success: true, message: 'Verification email sent' })
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' })
  }
  await authService.verifyEmail(token)
  res.json({ success: true, message: 'Email verified successfully' })
}
