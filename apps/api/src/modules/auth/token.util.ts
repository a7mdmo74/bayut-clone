import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../../config/env'
import type { UserRole } from '@bayut-clone/types'

export interface AccessTokenPayload {
  userId: string
  role: UserRole
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
  })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string }
}
