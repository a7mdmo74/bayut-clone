import type { Request, Response } from 'express'
import { createCheckoutSchema, paginationQuerySchema } from '@repo/types'
import { prisma } from '../../lib/prisma'
import * as paymentsService from './payments.service'

export async function createCheckout(req: Request, res: Response) {
  const parsed = createCheckoutSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
  }

  const checkout = await paymentsService.createCheckout(req.user!.userId, parsed.data)
  res.status(201).json(checkout)
}

export async function getHistory(req: Request, res: Response) {
  const paginationParsed = paginationQuerySchema.safeParse(req.query)
  if (!paginationParsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: paginationParsed.error.flatten().fieldErrors,
    })
  }

  const history = await paymentsService.getPaymentHistory(req.user!.userId, paginationParsed.data)
  res.json(history)
}

export async function getAgentTransactions(req: Request, res: Response) {
  const paginationParsed = paginationQuerySchema.safeParse(req.query)
  if (!paginationParsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: paginationParsed.error.flatten().fieldErrors,
    })
  }

  const transactions = await paymentsService.getAgentTransactions(
    req.user!.userId,
    paginationParsed.data
  )
  res.json(transactions)
}

export async function getPlans(req: Request, res: Response) {
  const plans = await paymentsService.getActivePlans()
  res.json(plans)
}

export async function getSubscription(req: Request, res: Response) {
  // Get agent by user ID
  const agent = await prisma.agent.findUnique({
    where: { userId: req.user!.userId },
  })

  if (!agent) {
    return res.status(404).json({ error: 'Agent profile not found' })
  }

  const subscription = await paymentsService.getAgentSubscription(agent.id)
  if (!subscription) {
    return res.status(404).json({ error: 'No active subscription found' })
  }

  res.json(subscription)
}

/**
 * Stripe webhook handler. Expects raw body (Buffer) from express.raw().
 * Registered on the app BEFORE express.json() — see index.ts.
 */
export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature']
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing stripe-signature header' })
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))

  const result = await paymentsService.handleStripeWebhook(rawBody, signature)
  res.status(200).json(result)
}

export async function getPaymentById(req: Request, res: Response) {
  const paymentId = req.params.id

  if (!paymentId) {
    return res.status(400).json({ error: 'Payment ID is required' })
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const role = req.user.role || 'BUYER'
  const payment = await paymentsService.getPaymentById(paymentId, req.user.userId, role)

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' })
  }

  res.json(payment)
}

export async function refundPayment(req: Request, res: Response) {
  const paymentId = req.params.id
  if (!paymentId) {
    return res.status(400).json({ error: 'Payment ID is required' })
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined
  const role = req.user.role || 'BUYER'
  const payment = await paymentsService.refundPayment(paymentId, req.user.userId, role, reason)
  res.json(payment)
}
