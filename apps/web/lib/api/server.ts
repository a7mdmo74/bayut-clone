import 'server-only'

import { cookies } from 'next/headers'
import { refreshAccessToken, clearAuthCookies } from '@/lib/auth/refreshSession'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function serverFetch<T>(
  path: string,
  options: RequestInit & { cache?: RequestCache } = {},
  isRetry = false
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  const makeRequest = async (authToken?: string) => {
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
      cache: authToken ? 'no-store' : (options.cache ?? 'force-cache'),
    })
  }

  let res = await makeRequest(token)

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken()

    if (!refreshed) {
      await clearAuthCookies()
      throw new AuthError('Authentication failed. Please log in again.')
    }

    // Server Components cannot call cookies().set(), so we use the
    // returned access token directly for the retry instead of re-reading
    // from the cookie store.
    res = await makeRequest(refreshed.accessToken)
    // Retry once with the fresh token
    if (res.status === 401) {
      await clearAuthCookies()
      throw new AuthError('Authentication failed. Please log in again.')
    }
  }

  // Neon cold starts / brief pooler blips often surface as 503 — retry once
  if (res.status === 503) {
    await new Promise(resolve => setTimeout(resolve, 1200))
    res = await makeRequest(token)
  }

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${await res.text()}`)
  }

  return res.json()
}
