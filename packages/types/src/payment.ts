import { z } from 'zod'

// ==========================================
// ENUMS
// ==========================================

export const planIntervalSchema = z.enum(['MONTHLY', 'YEARLY'])
export type PlanInterval = z.infer<typeof planIntervalSchema>

export const subscriptionStatusSchema = z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'])
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>

export const paymentProviderSchema = z.enum(['STRIPE'])
export type PaymentProvider = z.infer<typeof paymentProviderSchema>

export const paymentStatusSchema = z.enum([
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
  'CANCELED',
])
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export const paymentPurposeSchema = z.enum([
  'SUBSCRIPTION',
  'LISTING_BOOST',
  'LEAD_CREDITS',
  'PROPERTY_RESERVATION',
])
export type PaymentPurpose = z.infer<typeof paymentPurposeSchema>

/** Fixed reservation fee for sale listings (buyer payment test path) */
export const PROPERTY_RESERVATION_FEE_AED = 500

// ==========================================
// INPUT SCHEMAS
// ==========================================

export const createCheckoutSchema = z
  .object({
    purpose: paymentPurposeSchema,
    provider: paymentProviderSchema.default('STRIPE'),
    // For SUBSCRIPTION
    planId: z.string().uuid().optional(),
    // For LISTING_BOOST / PROPERTY_RESERVATION
    propertyId: z.string().uuid().optional(),
    boostDays: z.number().int().positive().optional(),
    // For LEAD_CREDITS
    creditCount: z.number().int().positive().optional(),
  })
  .refine(
    data => {
      if (data.purpose === 'SUBSCRIPTION') return !!data.planId
      if (data.purpose === 'LISTING_BOOST') return !!data.propertyId && !!data.boostDays
      if (data.purpose === 'LEAD_CREDITS') return !!data.creditCount
      if (data.purpose === 'PROPERTY_RESERVATION') return !!data.propertyId
      return false
    },
    {
      message: 'Invalid combination of purpose and required fields',
      path: ['purpose'],
    }
  )
export type CreateCheckoutInput = z.input<typeof createCheckoutSchema>
export type CreateCheckoutPayload = z.infer<typeof createCheckoutSchema>

// ==========================================
// OUTPUT DTOs
// ==========================================

export interface PlanDTO {
  id: string
  name: string
  interval: PlanInterval
  priceAed: number
  maxListings: number
  maxFeatured: number
  isActive: boolean
}

export interface SubscriptionDTO {
  id: string
  agentId: string
  plan: PlanDTO
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export interface PaymentDTO {
  id: string
  subscriptionId: string | null
  userId: string
  provider: PaymentProvider
  purpose: PaymentPurpose | 'VIEWING_DEPOSIT'
  amountAed: number
  status: PaymentStatus
  providerRef: string
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface CheckoutResponse {
  paymentId: string
  /** Hosted checkout URL (Stripe Checkout Session URL) */
  redirectUrl: string
  provider: PaymentProvider
  amountAed: number
}

export interface PaymentHistoryResponse {
  data: PaymentDTO[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
