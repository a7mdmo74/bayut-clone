import type Stripe from 'stripe'
import { env } from '../../../config/env'
import { logger } from '../../../lib/logger'
import { getStripe, isStripeConfigured } from '../../../lib/stripe'
import type { PaymentPurpose } from '@repo/types'
import { logWebhookSecurityEvent } from '../webhook-security'

export { isStripeConfigured }

const PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  SUBSCRIPTION: 'Subscription',
  LISTING_BOOST: 'Listing boost',
  LEAD_CREDITS: 'Lead credits',
  PROPERTY_RESERVATION: 'Property reservation',
}

export function checkoutLabelForPurpose(purpose: PaymentPurpose): string {
  return PURPOSE_LABELS[purpose] ?? purpose
}

interface StripeCheckoutRequest {
  amountAed: number
  purpose: PaymentPurpose
  paymentId: string
  idempotencyKey: string
  metadata?: Record<string, string>
}

interface StripeCheckoutResponse {
  redirectUrl: string
  sessionId: string
}

/**
 * Create a Stripe Checkout Session (hosted card payment).
 * Uses the app idempotency key as Stripe's native idempotency key too.
 */
export async function createStripeCheckout(
  request: StripeCheckoutRequest
): Promise<StripeCheckoutResponse> {
  const stripe = getStripe()
  const label = checkoutLabelForPurpose(request.purpose)

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aed',
            product_data: { name: label },
            unit_amount: Math.round(request.amountAed * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${env.FRONTEND_URL}/payments/success?payment_id=${request.paymentId}`,
      cancel_url: `${env.FRONTEND_URL}/payments/cancel`,
      metadata: {
        paymentId: request.paymentId,
        purpose: request.purpose,
        ...(request.metadata ?? {}),
      },
    },
    { idempotencyKey: request.idempotencyKey }
  )

  if (!session.url) {
    throw new Error('Stripe Checkout Session missing redirect URL')
  }

  logger.info(
    { sessionId: session.id, paymentId: request.paymentId, amountAed: request.amountAed },
    'Stripe checkout session created'
  )

  return { redirectUrl: session.url, sessionId: session.id }
}

/**
 * Refund a captured payment. `providerRef` stores the Checkout Session ID,
 * so we resolve the PaymentIntent from the session before calling Refunds.
 */
export async function refundStripePayment(opts: {
  providerRef: string
  amountAed: number
  reason?: string
}): Promise<{ refundId: string; status: string }> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.retrieve(opts.providerRef)
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

  if (!paymentIntentId) {
    throw new Error('Checkout session has no payment_intent to refund')
  }

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(opts.amountAed * 100),
    ...(opts.reason ? { reason: 'requested_by_customer' as const } : {}),
    metadata: opts.reason ? { reason: opts.reason } : undefined,
  })

  logger.info(
    {
      sessionId: opts.providerRef,
      paymentIntentId,
      refundId: refund.id,
      amountAed: opts.amountAed,
      status: refund.status,
    },
    'Stripe refund created'
  )

  return { refundId: refund.id, status: refund.status ?? 'unknown' }
}

export function constructStripeEvent(
  rawBody: Buffer | string,
  signature: string
): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  try {
    const event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
    logWebhookSecurityEvent('STRIPE', 'signature_verified', { type: event.type })
    return event
  } catch (error) {
    logWebhookSecurityEvent('STRIPE', 'signature_failed', {
      hasSignature: !!signature,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
