import { clientFetch } from '@/lib/api/client'
import type { ViewingDTO, RequestViewingResponse, CancelViewingResponse } from '@repo/types'
import { VIEWING_POLICY } from '@repo/types'

export const VIEWING_POLICY_CONSTANT = VIEWING_POLICY

export function requestViewing(propertyId: string, scheduledAt: string) {
  return clientFetch<RequestViewingResponse>('/viewings', {
    method: 'POST',
    body: JSON.stringify({ propertyId, scheduledAt }),
    cache: 'no-store',
  })
}

export function getMyViewings() {
  return clientFetch<ViewingDTO[]>('/viewings/my', {
    cache: 'no-store',
  })
}

export function getViewing(id: string) {
  return clientFetch<ViewingDTO>(`/viewings/${id}`, {
    cache: 'no-store',
  })
}

export function cancelViewing(id: string, reason?: string) {
  return clientFetch<CancelViewingResponse>(`/viewings/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
    cache: 'no-store',
  })
}
