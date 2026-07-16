import { clientFetch } from '@/lib/api/client'
import type { PropertyDTO } from '@repo/types'

export async function getFeaturedProperties(limit = 6) {
  return clientFetch<PropertyDTO[]>(`/properties/featured?limit=${limit}`)
}
