import { z } from 'zod'

export const userRoleSchema = z.enum(['BUYER', 'AGENT', 'AGENCY_ADMIN', 'ADMIN'])
export type UserRole = z.infer<typeof userRoleSchema>

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(7).optional(),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

// Pure output shape — your backend constructs this, nothing external to validate
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
