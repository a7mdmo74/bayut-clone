import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import type { UserRole } from '@repo/types'

const protectedPrefixes = ['/dashboard', '/agent', '/admin', '/become-agent'] as const
const intlMiddleware = createMiddleware(routing)

function localePrefix(pathname: string): { locale: string | undefined; path: string } {
  const match = pathname.match(/^\/(ar|en)(?=\/|$)/)
  const locale = match?.[1]
  const path = pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/'
  return { locale, path }
}

function loginUrl(request: NextRequest, locale: string | undefined, redirectPath: string) {
  const loginPath = locale === 'en' ? '/en/login' : '/login'
  const url = new URL(loginPath, request.url)
  url.searchParams.set('redirect', redirectPath)
  return url
}

/** Decode JWT payload without verification (edge gate; layouts re-check). */
function roleFromAccessToken(token: string): UserRole | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const json = JSON.parse(
      Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    ) as { role?: string }
    if (
      json.role === 'BUYER' ||
      json.role === 'AGENT' ||
      json.role === 'AGENCY_ADMIN' ||
      json.role === 'ADMIN'
    ) {
      return json.role
    }
    return null
  } catch {
    return null
  }
}

function homeForRole(role: UserRole, locale: string | undefined): string {
  const prefix = locale === 'en' ? '/en' : ''
  if (role === 'ADMIN') return `${prefix}/admin/dashboard`
  if (role === 'AGENT' || role === 'AGENCY_ADMIN') return `${prefix}/agent/dashboard`
  return `${prefix}/dashboard`
}

export default function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request)
  const { locale, path } = localePrefix(request.nextUrl.pathname)
  const isProtected = protectedPrefixes.some(p => path.startsWith(p))

  if (!isProtected) {
    return intlResponse
  }

  const token = request.cookies.get('accessToken')?.value
  if (!token) {
    return Response.redirect(loginUrl(request, locale, path))
  }

  const role = roleFromAccessToken(token)

  // Buyer cannot access agent portal
  if (path.startsWith('/agent') && role && role !== 'AGENT' && role !== 'AGENCY_ADMIN') {
    return Response.redirect(new URL(homeForRole(role, locale), request.url))
  }

  // Non-admin cannot access admin portal (agents + buyers)
  if (path.startsWith('/admin') && role && role !== 'ADMIN') {
    return Response.redirect(new URL(homeForRole(role, locale), request.url))
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
