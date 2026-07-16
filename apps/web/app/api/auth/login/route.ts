import { NextResponse } from 'next/server'
import { loginSchema } from '@repo/types'
import { API_URL } from '@/lib/api/proxy-request'
import { getRoleFromToken } from '@/lib/auth/redirects'

export async function POST(request: Request) {
  const body = await request.json()

  // Validate input
  const validationResult = loginSchema.safeParse(body)
  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors
    return NextResponse.json({ fieldErrors }, { status: 400 })
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validationResult.data),
    })
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the authentication service. Is the API running?' },
      { status: 503 }
    )
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Login failed' }))
    return NextResponse.json(error, { status: res.status })
  }

  const payload = await res.json()
  const { accessToken, refreshToken } = payload
  const role = payload?.role ?? payload?.user?.role ?? getRoleFromToken(accessToken)

  const response = NextResponse.json({ success: true, role })
  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 min, matches your backend's access token expiry
    path: '/',
  })
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })

  return response
}
