import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api/proxy-request'

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the authentication service. Is the API running?' },
      { status: 503 }
    )
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Token refresh failed' }))
    // Clear cookies on refresh failure so the app doesn't keep retrying
    // with a dead token — force a clean re-login instead
    const response = NextResponse.json(error, { status: res.status })
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')
    return response
  }

  const { accessToken, refreshToken: newRefreshToken } = await res.json()

  const response = NextResponse.json({ success: true })
  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 min
    path: '/',
  })
  response.cookies.set('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })

  return response
}
