import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { hashPassword, comparePassword } from './password.util'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.util'
import { randomBytes } from 'crypto'
import type { RegisterInput, LoginInput } from '@repo/types'
import { logger } from '../../lib/logger'
import { sendEmail } from '../../lib/email'
import { env } from '../../config/env'

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError(409, 'An account with this email already exists')
  }

  const hashedPassword = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    },
  })

  // Send verification email (fire-and-forget)
  sendVerificationEmail(user.id).catch(err => {
    logger.error({ err, userId: user.id }, 'Failed to send verification email after registration')
  })

  return issueTokens(user.id, user.role)
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new AppError(401, 'Invalid email or password')
  }

  const isValid = await comparePassword(input.password, user.password)
  if (!isValid) {
    throw new AppError(401, 'Invalid email or password')
  }

  return issueTokens(user.id, user.role)
}

async function issueTokens(userId: string, role: string) {
  const accessToken = signAccessToken({ userId, role: role as any })
  const refreshToken = signRefreshToken(userId)

  // store the refresh token in the DB so it can be revoked later
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  })

  return { accessToken, refreshToken }
}

export async function refreshAccessToken(oldRefreshToken: string) {
  let payload: { userId: string }
  try {
    payload = verifyRefreshToken(oldRefreshToken)
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } })
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token is no longer valid')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    throw new AppError(401, 'User no longer exists')
  }

  // rotate: revoke the old one, issue a new pair
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } })
  return issueTokens(user.id, user.role)
}

export async function logoutUser(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  })
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
    },
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  return user
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to avoid email enumeration
  if (!user) {
    return
  }

  // Generate a secure random token
  const resetToken = randomBytes(32).toString('hex')
  const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour from now

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiresAt,
    },
  })

  const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000'
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

  sendEmail({
    to: user.email,
    subject: 'Reset Your Password — Bayara',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${user.firstName},</h2>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>Bayara Real Estate Team</p>
      </div>
    `,
  }).catch(err => {
    logger.error({ err, userId: user.id }, 'Failed to send password reset email')
  })

  // Also log in development for easy testing
  if (process.env.NODE_ENV !== 'production') {
    logger.info({ email, resetToken, resetUrl }, 'Password reset token (development mode)')
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: {
        gte: new Date(),
      },
    },
  })

  if (!user) {
    throw new AppError(400, 'Invalid or expired reset token')
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  })
}

export async function sendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.isVerified) return

  const verificationToken = randomBytes(32).toString('hex')
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationToken,
      verificationTokenExpiresAt,
    },
  })

  const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000'
  const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`

  sendEmail({
    to: user.email,
    subject: 'Verify Your Email — Bayara',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome ${user.firstName}!</h2>
        <p>Thank you for creating an account with Bayara. Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <p>Best regards,<br>Bayara Real Estate Team</p>
      </div>
    `,
  }).catch(err => {
    logger.error({ err, userId }, 'Failed to send verification email')
  })
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiresAt: {
        gte: new Date(),
      },
    },
  })

  if (!user) {
    throw new AppError(400, 'Invalid or expired verification token')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  })
}
