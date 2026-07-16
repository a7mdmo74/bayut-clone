import { clientFetch } from './client'
import type { PropertyDTO, PaginatedResponse } from '@repo/types'

export interface UserFavorite {
  id: string
  propertyId: string
  property: PropertyDTO
  createdAt: string
}

export class FavoriteError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'FavoriteError'
    this.status = status
  }
}

async function favoritesRequest(propertyId: string, method: 'POST' | 'DELETE') {
  const res = await fetch(`/api/favorites/${propertyId}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (res.status === 401) {
    throw new FavoriteError(401, 'Please log in to save favorites')
  }

  if (!res.ok) {
    throw new FavoriteError(res.status, 'Failed to update favorite')
  }

  if (res.status === 204) {
    return null
  }

  return res.json()
}

export function getUserFavorites() {
  return clientFetch<PaginatedResponse<UserFavorite>>('/api/favorites')
}

export async function addFavorite(propertyId: string) {
  return favoritesRequest(propertyId, 'POST')
}

export async function removeFavorite(propertyId: string) {
  return favoritesRequest(propertyId, 'DELETE')
}

export interface SavedSearch {
  id: string
  name: string
  filters: Record<string, any>
  emailAlerts: boolean
  createdAt: string
}

export function getUserSavedSearches() {
  return clientFetch<SavedSearch[]>('/saved-searches')
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

export function getUserInquiries() {
  return clientFetch<UserInquiry[]>('/leads/user')
}
