import { prisma } from '../../lib/prisma'
import { hashPassword, comparePassword } from './password.util'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.util'
import type { RegisterInput, LoginInput } from '@bayut-clone/types'

class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
  }
}

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
