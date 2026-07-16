import { serverFetch } from './server'
import type { PropertyDTO, PaginatedResponse, PropertySearchQuery } from '@repo/types'

export function getProperty(slug: string) {
  return serverFetch<PropertyDTO>(`/properties/${slug}`, {
    cache: 'force-cache',
  })
}

export function searchProperties(query: PropertySearchQuery & { page?: number; limit?: number }) {
  const cleaned = Object.fromEntries(
    Object.entries(query).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  )
  const params = new URLSearchParams(cleaned as Record<string, string>)
  return serverFetch<PaginatedResponse<PropertyDTO>>(`/properties?${params}`, {
    cache: 'no-store',
  })
}
