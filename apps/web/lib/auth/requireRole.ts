import { redirect } from 'next/navigation'
import type { UserRole } from '@repo/types'
import { getSession, type SessionUser } from './session'

/** Redirect unauthenticated users to login. */
export async function requireSession(loginRedirect = '/login'): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    redirect(loginRedirect)
  }
  return session
}

/** Home path for a role after a forbidden access attempt. */
export function homePathForRole(role: UserRole): string {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'AGENT' || role === 'AGENCY_ADMIN') return '/agent/dashboard'
  return '/dashboard'
}

/**
 * Require one of the given roles. Wrong-role users are sent to their own home.
 */
export async function requireRoles(...roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession()
  if (!roles.includes(session.role)) {
    redirect(homePathForRole(session.role))
  }
  return session
}
