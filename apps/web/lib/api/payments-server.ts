import 'server-only'

import { serverFetch } from './server'
import type {
  CreateCheckoutInput,
  CheckoutResponse,
  PaymentHistoryResponse,
  PlanDTO,
  SubscriptionDTO,
  PaymentDTO,
} from '@repo/types'

export interface AgentTransaction {
  id: string
  propertyId: string | null
  propertyTitle: string | null
  propertySlug: string | null
  propertyStatus: string | null
  propertyPrice: number
  propertyImage: string | null
  amountAed: number
  status: string
  buyerName: string | null
  buyerEmail: string | null
  buyerPhone: string | null
  createdAt: string
}

export interface AgentTransactionsResponse {
  data: AgentTransaction[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Server-side functions
export function createCheckoutServer(input: CreateCheckoutInput) {
  return serverFetch<CheckoutResponse>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getPaymentHistory(query: { page?: number; limit?: number }) {
  const params = new URLSearchParams(query as Record<string, string>)
  return serverFetch<PaymentHistoryResponse>(`/payments/history?${params}`)
}

export function getPlans() {
  return serverFetch<PlanDTO[]>('/payments/plans', {
    cache: 'force-cache',
  })
}

export function getSubscription() {
  return serverFetch<SubscriptionDTO>('/payments/subscription')
}

export function getPaymentByIdServer(paymentId: string) {
  return serverFetch<PaymentDTO>(`/payments/${paymentId}`)
}

export function getAgentTransactions(query: { page?: number; limit?: number }) {
  const params = new URLSearchParams(query as Record<string, string>)
  return serverFetch<AgentTransactionsResponse>(`/payments/agent-transactions?${params}`)
}
