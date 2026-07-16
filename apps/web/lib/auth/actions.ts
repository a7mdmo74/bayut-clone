'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'

export async function logout() {
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

  // Clear cookies
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')

  redirect('/')
}
