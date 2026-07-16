import Stripe from 'stripe'
import { env } from '../config/env'

/**
 * Stripe server client.
 * Instantiated at module load; use getStripe() / isStripeConfigured() so local
 * mock checkout can skip real API calls when credentials are omitted.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_not_configured')

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe credentials not configured (STRIPE_SECRET_KEY)')
  }
  return stripe
}

export function isStripeConfigured(): boolean {
  return !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)
}
