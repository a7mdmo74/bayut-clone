import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode' // just for reading payload, not verifying
import type { UserRole } from '@repo/types'

export interface SessionUser {
  userId: string
  role: UserRole
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) return null

  try {
    return jwtDecode<SessionUser>(token)
  } catch {
    return null
  }
}

// Convenience getter for user ID
export async function getUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.userId || null
}
