import { clientFetch } from './client'

export interface AgentDashboardStats {
  activeListings: number
  totalViews: number
  inquiries: number
  leadCredits: number
}

export interface AgentProperty {
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
  createdAt: string
  views: number
  inquiries: number
  images: string[]
}

export interface AgentLead {
  id: string
  propertyId: string
  propertyTitle: string
  senderName: string
  senderEmail: string
  senderPhone: string
  message: string
  status: 'NEW' | 'CONTACTED' | 'CLOSED'
  createdAt: string
}

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
}

export async function getAgentProperties() {
  return clientFetch<AgentProperty[]>('/agents/properties')
}

export async function updateAgentProfile(data: { bio?: string; languages?: string[] }) {
  return clientFetch('/agents/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
