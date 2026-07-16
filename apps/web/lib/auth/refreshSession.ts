import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface RefreshResult {
  accessToken: string
  refreshToken: string
}

/**
 * Attempts to refresh the access token by calling the backend directly.
 * Called by serverFetch/proxyFetch when a request returns 401.
 *
 * Reads the refreshToken from cookies, sends it to the backend, and
 * returns the new token pair on success. The caller is responsible for
 * persisting the new tokens (setting cookies in Route Handler context,
 * or using the returned access token directly in Server Component context
 * where cookies().set() is not available).
 *
 * @returns The new token pair on success, or null if refresh failed.
 */
export async function refreshAccessToken(): Promise<RefreshResult | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (!refreshToken) {
    return null
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    return null
  }

  if (!res.ok) {
    return null
  }

  const { accessToken, refreshToken: newRefreshToken } = await res.json()
  return { accessToken, refreshToken: newRefreshToken }
}

/**
 * Persists refreshed tokens as cookies.
 * Only works in Route Handler or Server Action context — will throw in
 * Server Component context (cookies().set() is not allowed there).
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 min
    path: '/',
  })
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

/**
 * Clears auth cookies. Safe to call from any server context — in Server
 * Component context where cookies().delete() is not supported, the
 * deletion is silently skipped (cookies persist until the browser
 * navigates to a Route Handler that clears them).
 */
export async function clearAuthCookies() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('accessToken')
    cookieStore.delete('refreshToken')
  } catch {
    // cookies().delete() is not supported in Server Component context.
    // The stale cookies will persist until the client hits a Route Handler
    // that clears them (e.g. /api/auth/logout).
  }
}

/**
 * Redirects to login page with optional redirect parameter.
 * Used when refresh fails or user is explicitly logged out.
 */
export function redirectToLogin(currentPath?: string) {
  const loginUrl = currentPath
    ? `/login?redirect=${encodeURIComponent(currentPath)}`
    : '/login'
  redirect(loginUrl)
}
