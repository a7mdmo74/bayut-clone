import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../modules/auth/token.util'
import { AppError } from '../utils/AppError'
import type { UserRole } from '@bayut-clone/types'

// extend Express's Request type so req.user is known to TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: UserRole }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization // expected format: "Bearer <token>"
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'No access token provided')
  }

  const token = header.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    throw new AppError(401, 'Invalid or expired access token')
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'You do not have permission to perform this action')
    }
    next()
  }
}
