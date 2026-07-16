import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api/proxy-request'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (refreshToken) {
    // Call backend logout to invalidate refresh token
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {
      // Continue even if backend logout fails
    })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')

  return response
}
