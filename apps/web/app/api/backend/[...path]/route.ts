import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api/proxy-request'

const ALLOWED_PREFIXES = [
  'auth',
  'viewings',
  'payments',
  'agent',
  'agents',
  'admin',
  'saved-searches',
  'leads',
  'properties',
  'users',
  'uploads',
  'locations',
  'amenities',
  'notifications',
]

function isAllowedPath(pathSegments: string[]) {
  const prefix = pathSegments[0]
  return prefix !== undefined && ALLOWED_PREFIXES.includes(prefix)
}

async function handle(request: NextRequest, pathSegments: string[]) {
  // DEBUG: log incoming cookie header so we can see what browser sent
  try {
    console.log('[backend-proxy] incoming cookie header:', request.headers.get('cookie'))
  } catch (e) {
    console.log('[backend-proxy] cookie header read failed', e)
  }
  if (!isAllowedPath(pathSegments)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const path = `/${pathSegments.join('/')}`
  const search = request.nextUrl.search
  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined

  return proxyToApi(`${path}${search}`, {
    method: request.method,
    body: body || undefined,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(request, path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(request, path)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(request, path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(request, path)
}
