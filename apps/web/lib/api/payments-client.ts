import { clientFetch } from './client'
import type { PaymentDTO, CreateCheckoutInput, CheckoutResponse } from '@repo/types'

// Client-side function for payment polling
export function getPaymentById(paymentId: string) {
  return clientFetch<PaymentDTO>(`/payments/${paymentId}`)
}

// Client-side function for checkout
export function createCheckout(input: CreateCheckoutInput) {
  return clientFetch<CheckoutResponse>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
