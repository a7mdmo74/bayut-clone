import { clientFetch } from './client'

export interface AgentProfile {
  id: string
  licenseNo: string | null
  bio: string | null
  languages: string[]
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    avatarUrl: string | null
  }
  agency: {
    id: string
    name: string
    logoUrl: string | null
    licenseNo: string | null
  } | null
  properties: Array<{
    id: string
    title: string
    slug: string
    type: string
    price: number
    status: string
    location: string
    bedrooms: number | null
    bathrooms: number | null
    areaSqft: number | null
    images: string[]
  }>
}

export async function getAgent(id: string): Promise<AgentProfile | null> {
  return clientFetch<AgentProfile>(`/agents/${id}/public`)
}