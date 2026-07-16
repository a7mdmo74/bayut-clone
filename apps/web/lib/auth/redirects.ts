import { jwtDecode } from 'jwt-decode'
import type { UserRole } from '@repo/types'

export function getDashboardPath(role?: UserRole | string | null): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'AGENT':
    case 'AGENCY_ADMIN':
      return '/agent/dashboard'
    default:
      return '/dashboard'
  }
}

export function getRoleFromToken(token?: string | null): UserRole | null {
  if (!token) {
    return null
  }

  try {
    const payload = jwtDecode<{ role?: string }>(token)
    return payload.role === 'BUYER' ||
      payload.role === 'AGENT' ||
      payload.role === 'AGENCY_ADMIN' ||
      payload.role === 'ADMIN'
      ? (payload.role as UserRole)
      : null
  } catch {
    return null
  }
}
