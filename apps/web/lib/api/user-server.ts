import 'server-only'

import { proxyFetch } from './proxy-request'
import type { PropertyDTO, PaginatedResponse, AuthUser } from '@repo/types'

export interface UserFavorite {
  id: string
  propertyId: string
  property: PropertyDTO
  createdAt: string
}

export interface SavedSearch {
  id: string
  name: string
  filters: Record<string, unknown>
  alertsOn: boolean
  createdAt: string
}

export interface UserInquiry {
  id: string
  propertyId: string
  property: {
    id: string
    title: string
    slug: string
  }
  name: string
  email: string
  phone: string
  message: string
  status: 'NEW' | 'CONTACTED' | 'CLOSED'
  createdAt: string
}

export function getCurrentUser() {
  return proxyFetch<AuthUser & { phone?: string }>('/auth/me')
}

export function getUserFavorites() {
  return proxyFetch<PaginatedResponse<UserFavorite>>('/favorites?page=1&limit=50')
}

export function getUserSavedSearches() {
  return proxyFetch<SavedSearch[]>('/saved-searches')
}

export function getUserInquiries() {
  return proxyFetch<UserInquiry[]>('/leads/user')
}
