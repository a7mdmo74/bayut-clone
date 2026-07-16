import { z } from 'zod'

// ==========================================
// ENUMS
// ==========================================

export const viewingStatusSchema = z.enum([
  'REQUESTED',
  'DEPOSIT_PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELED_BY_BUYER',
  'CANCELED_BY_AGENT',
  'NO_SHOW',
])
export type ViewingStatus = z.infer<typeof viewingStatusSchema>

export const depositStatusSchema = z.enum([
  'PENDING',
  'HELD',
  'REFUNDED',
  'FORFEITED',
  'FAILED',
])
export type DepositStatus = z.infer<typeof depositStatusSchema>

// ==========================================
// VIEWING POLICY (free bookings)
// ==========================================

export const VIEWING_POLICY = {
  MIN_HOURS_AHEAD: 2,
} as const

/** @deprecated Viewings are free — kept for type compatibility with older UI */
export const DEPOSIT_POLICY = {
  AMOUNT: 0,
  MIN_HOURS_AHEAD: VIEWING_POLICY.MIN_HOURS_AHEAD,
  FULL_REFUND_HOURS: 24,
  PARTIAL_REFUND_HOURS: 2,
  PARTIAL_REFUND_PERCENTAGE: 0.5,
} as const

export function estimateRefund(): number {
  return 0
}

// ==========================================
// INPUT SCHEMAS
// ==========================================

export const requestViewingSchema = z.object({
  propertyId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
})
export type RequestViewingInput = z.infer<typeof requestViewingSchema>

export const cancelViewingSchema = z.object({
  reason: z.string().optional(),
})
export type CancelViewingInput = z.infer<typeof cancelViewingSchema>

// ==========================================
// OUTPUT DTOs
// ==========================================

export interface ViewingDTO {
  id: string
  propertyId: string
  buyerId: string
  agentId: string | null
  scheduledAt: string
  status: ViewingStatus
  depositStatus: DepositStatus
  depositAmount: number
  depositPaymentId: string | null
  cancelReason: string | null
  canceledAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  property: {
    id: string
    title: string
    slug: string
    images: string[]
    community: {
      id: string
      name: string
      emirate: string
    } | null
  } | null
}

export interface RequestViewingResponse {
  viewing: ViewingDTO
  checkoutUrl?: string
}

export interface CancelViewingResponse {
  viewing: ViewingDTO
  refundAmount: number
  depositStatus: DepositStatus
}
