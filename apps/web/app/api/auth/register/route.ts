import { NextResponse } from 'next/server'
import { registerSchema } from '@repo/types'
import { API_URL } from '@/lib/api/proxy-request'
import { getRoleFromToken } from '@/lib/auth/redirects'

export async function POST(request: Request) {
  const body = await request.json()

  // Validate input
  const validationResult = registerSchema.safeParse(body)
  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors
    return NextResponse.json({ fieldErrors }, { status: 400 })
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/register`, {
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
    const error = await res.json().catch(() => ({ error: 'Registration failed' }))
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
    maxAge: 15 * 60,
    path: '/',
  })
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
