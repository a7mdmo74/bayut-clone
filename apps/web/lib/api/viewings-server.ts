import 'server-only'

import { serverFetch } from './server'
import type { ViewingDTO } from '@repo/types'

export function getMyViewings() {
  return serverFetch<ViewingDTO[]>('/viewings/my')
}

export function getAgentViewings() {
  return serverFetch<ViewingDTO[]>('/viewings/agent')
}
