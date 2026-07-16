import { NextResponse } from 'next/server'
import { API_URL } from '@/lib/api/proxy-request'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => null)
    return NextResponse.json(data ?? { success: true }, { status: response.status })
  } catch (error) {
    console.error('Failed to submit lead:', error)
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
  }
}
