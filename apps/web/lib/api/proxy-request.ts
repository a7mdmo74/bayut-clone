import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { refreshAccessToken, setAuthCookies, clearAuthCookies } from '@/lib/auth/refreshSession'

export const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function getAuthToken() {
  const cookieStore = await cookies()
  let token = cookieStore.get('accessToken')?.value

  if (!token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await setAuthCookies(refreshed.accessToken, refreshed.refreshToken)
      token = refreshed.accessToken
    }
  }

  return token
}

async function fetchWithAuth(path: string, options: RequestInit, token?: string) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}

export async function proxyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = await getAuthToken()
  let res = await fetchWithAuth(path, options, token)

  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await setAuthCookies(refreshed.accessToken, refreshed.refreshToken)
      token = refreshed.accessToken
      res = await fetchWithAuth(path, options, token)
    } else {
      await clearAuthCookies()
      throw new Error('Authentication failed. Please log in again.')
    }
  }

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${await res.text()}`)
  }

  return res.json()
}

const PUBLIC_PATHS = ['/properties/featured', '/locations', '/amenities']

export async function proxyToApi(path: string, options: RequestInit = {}) {
  const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p))
  let token = isPublic ? undefined : await getAuthToken()
  if (!token && !isPublic) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let res = await fetchWithAuth(path, options, token)

  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await setAuthCookies(refreshed.accessToken, refreshed.refreshToken)
      token = refreshed.accessToken
      res = await fetchWithAuth(path, options, token)
    } else {
      await clearAuthCookies()
      return NextResponse.json(
        { error: 'Authentication failed. Please log in again.' },
        { status: 401 }
      )
    }
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: res.status })
  }

  const data = await res.json().catch(() => null)
  return NextResponse.json(data, { status: res.status })
}
