import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import { randomUUID } from 'crypto'
import type {
  CreateCheckoutPayload,
  CheckoutResponse,
  PaymentDTO,
  SubscriptionDTO,
  PlanDTO,
  PaginationQuery,
} from '@repo/types'
import { PROPERTY_RESERVATION_FEE_AED } from '@repo/types'
import { env } from '../../config/env'
import {
  createStripeCheckout,
  constructStripeEvent,
  refundStripePayment,
  isStripeConfigured,
} from './providers/stripe'
import { getStripe } from '../../lib/stripe'
import { sendPaymentFailedEmail, sendPropertyReservationEmail } from '../../lib/email'
import type Stripe from 'stripe'

// ==========================================
// DTO TRANSFORMERS
// ==========================================

function toPlanDTO(plan: any): PlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    interval: plan.interval,
    priceAed: Number(plan.priceAed),
    maxListings: plan.maxListings,
    maxFeatured: plan.maxFeatured,
    isActive: plan.isActive,
  }
}

function toSubscriptionDTO(subscription: any): SubscriptionDTO {
  return {
    id: subscription.id,
    agentId: subscription.agentId,
    plan: toPlanDTO(subscription.plan),
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  }
}

function toPaymentDTO(payment: any): PaymentDTO {
  return {
    id: payment.id,
    subscriptionId: payment.subscriptionId,
    userId: payment.userId,
    provider: payment.provider,
    purpose: payment.purpose,
    amountAed: Number(payment.amountAed),
    status: payment.status,
    providerRef: payment.providerRef,
    metadata: payment.metadata,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  }
}

// ==========================================
// CHECKOUT CREATION
// ==========================================

export async function createCheckout(
  userId: string,
  input: CreateCheckoutPayload
): Promise<CheckoutResponse> {
  const idempotencyKey = randomUUID()

  // Calculate amount based on purpose
  let amountAed = 0
  let metadata: Record<string, any> = {}

  if (input.purpose === 'SUBSCRIPTION') {
    const plan = await prisma.plan.findUnique({
      where: { id: input.planId },
    })
    if (!plan || !plan.isActive) {
      throw new AppError(404, 'Plan not found or inactive')
    }
    amountAed = Number(plan.priceAed)
    metadata = { planId: plan.id }
  } else if (input.purpose === 'LISTING_BOOST') {
    const boostPricePerDay = 50
    amountAed = boostPricePerDay * input.boostDays!
    metadata = { propertyId: input.propertyId, boostDays: input.boostDays }
  } else if (input.purpose === 'LEAD_CREDITS') {
    const creditPrice = 5
    amountAed = creditPrice * input.creditCount!
    metadata = { creditCount: input.creditCount }
  } else if (input.purpose === 'PROPERTY_RESERVATION') {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    })
    if (!property) {
      throw new AppError(404, 'Property not found')
    }
    if (property.listingType !== 'SALE') {
      throw new AppError(400, 'Reservations are only available for sale listings')
    }
    if (property.status !== 'ACTIVE') {
      throw new AppError(400, 'Property is not available for reservation')
    }
    amountAed = PROPERTY_RESERVATION_FEE_AED
    metadata = { propertyId: property.id, propertyTitle: property.title }
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: 'STRIPE',
      purpose: input.purpose,
      amountAed,
      status: 'PENDING',
      providerRef: `pending-${idempotencyKey}`,
      idempotencyKey,
      metadata,
    },
  })

  let redirectUrl: string
  let providerRef: string

  try {
    if (!isStripeConfigured()) {
      throw new Error(
        'Stripe credentials not configured (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET)'
      )
    }

    const stripeResponse = await createStripeCheckout({
      amountAed,
      purpose: input.purpose,
      paymentId: payment.id,
      idempotencyKey,
      metadata: Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)])),
    })
    redirectUrl = stripeResponse.redirectUrl
    providerRef = stripeResponse.sessionId
  } catch (error) {
    // Never mock-capture in production — fail loudly so fake money never looks real
    if (env.NODE_ENV === 'production') {
      logger.error({ error, paymentId: payment.id }, 'Stripe checkout failed in production')

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        sendPaymentFailedEmail({
          userEmail: user.email,
          userName: user.firstName,
          amount: amountAed,
          purpose: input.purpose,
          locale: 'ar',
        }).catch(emailError => {
          logger.error(
            { emailError, paymentId: payment.id },
            'Failed to send payment failure email'
          )
        })
      }

      throw new AppError(502, 'Payment provider unavailable. Please try again.')
    }

    // Local/dev fallback when Stripe credentials are missing — mark paid and send to success page
    logger.warn(
      { error, paymentId: payment.id },
      'Stripe unavailable; using mock checkout (non-production only)'
    )
    providerRef = `mock-${payment.id}`
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CAPTURED', providerRef },
    })
    await fulfillPayment({ ...payment, status: 'CAPTURED', providerRef, metadata })
    redirectUrl = `${env.FRONTEND_URL}/payments/success?payment_id=${payment.id}`
    return {
      paymentId: payment.id,
      redirectUrl,
      provider: 'STRIPE',
      amountAed,
    }
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerRef },
  })

  logger.info({ paymentId: payment.id, provider: 'STRIPE', amountAed }, 'Checkout created')

  return {
    paymentId: payment.id,
    redirectUrl,
    provider: 'STRIPE',
    amountAed,
  }
}

// ==========================================
// WEBHOOK HANDLING
// ==========================================

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  let event: Stripe.Event
  try {
    event = constructStripeEvent(rawBody, signature)
  } catch {
    throw new AppError(400, 'Invalid webhook signature')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutSessionCompleted(session)
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutSessionExpired(session)
  }

  return { status: 'ok' }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId
  if (!paymentId) {
    logger.info(
      { sessionId: session.id },
      'Stripe checkout.session.completed missing paymentId metadata; acking'
    )
    return
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) {
    logger.warn(
      { paymentId, sessionId: session.id },
      'Payment not found for Stripe webhook; acking'
    )
    return
  }

  // Idempotency check: if already in terminal state, return without reprocessing
  if (['CAPTURED', 'FAILED', 'REFUNDED', 'CANCELED'].includes(payment.status)) {
    logger.info(
      { paymentId: payment.id, status: payment.status },
      'Payment already in terminal state, skipping webhook'
    )
    return
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'CAPTURED',
      providerRef: session.id,
    },
  })

  await fulfillPayment({
    ...payment,
    ...updatedPayment,
    status: 'CAPTURED',
    providerRef: session.id,
  })

  logger.info(
    { paymentId: payment.id, sessionId: session.id },
    'Stripe checkout.session.completed processed'
  )
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId
  if (!paymentId) return

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) return

  // Idempotency: only mark FAILED from PENDING
  if (payment.status !== 'PENDING') {
    logger.info(
      { paymentId: payment.id, status: payment.status },
      'Payment not PENDING on session.expired, skipping'
    )
    return
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED', providerRef: session.id },
  })

  logger.info(
    { paymentId: payment.id, sessionId: session.id },
    'Stripe checkout.session.expired processed'
  )
}

async function refreshStripeCheckoutSessionStatus(payment: any) {
  if (payment.provider !== 'STRIPE' || !payment.providerRef) {
    return payment
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(payment.providerRef)

    if (session.status === 'complete' || session.payment_status === 'paid') {
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CAPTURED', providerRef: session.id },
      })

      await fulfillPayment({
        ...payment,
        ...updatedPayment,
        status: 'CAPTURED',
        providerRef: session.id,
      })

      logger.info(
        { paymentId: payment.id, sessionId: session.id },
        'Stripe checkout session refreshed and marked CAPTURED'
      )
      return updatedPayment
    }

    if (session.status === 'expired') {
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', providerRef: session.id },
      })

      logger.info(
        { paymentId: payment.id, sessionId: session.id },
        'Stripe checkout session refreshed and marked FAILED'
      )
      return updatedPayment
    }
  } catch (error) {
    logger.warn(
      {
        paymentId: payment.id,
        sessionId: payment.providerRef,
        error: error instanceof Error ? error.message : String(error),
      },
      'Unable to refresh Stripe checkout session status'
    )
  }

  return payment
}

// ==========================================
// PAYMENT FULFILLMENT
// ==========================================

async function fulfillPayment(payment: any) {
  if (payment.purpose === 'SUBSCRIPTION') {
    await fulfillSubscription(payment)
  } else if (payment.purpose === 'LISTING_BOOST') {
    await fulfillListingBoost(payment)
  } else if (payment.purpose === 'LEAD_CREDITS') {
    await fulfillLeadCredits(payment)
  } else if (payment.purpose === 'PROPERTY_RESERVATION') {
    await fulfillPropertyReservation(payment)
  }
}

async function fulfillSubscription(payment: any) {
  const agent = await prisma.agent.findUnique({
    where: { userId: payment.userId },
  })
  if (!agent) {
    throw new AppError(404, 'Agent not found')
  }

  const planId = payment.metadata.planId
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  })
  if (!plan) {
    throw new AppError(404, 'Plan not found')
  }

  // Calculate period start/end based on plan interval
  const now = new Date()
  const periodEnd = new Date()
  if (plan.interval === 'MONTHLY') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  }

  // Create or update subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: { agentId: agent.id, status: 'ACTIVE' },
  })

  if (existingSubscription) {
    // Extend existing subscription
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      },
    })
  } else {
    // Create new subscription
    await prisma.subscription.create({
      data: {
        agentId: agent.id,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        payments: {
          connect: { id: payment.id },
        },
      },
    })
  }

  logger.info({ paymentId: payment.id, agentId: agent.id }, 'Subscription fulfilled')
}

async function fulfillListingBoost(payment: any) {
  const propertyId = payment.metadata.propertyId
  const boostDays = payment.metadata.boostDays

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })
  if (!property) {
    throw new AppError(404, 'Property not found')
  }

  // Calculate featured expiry
  const now = new Date()
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + boostDays)

  // Update property to be featured
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      isFeatured: true,
      featuredExpiry: expiryDate,
    },
  })

  logger.info({ paymentId: payment.id, propertyId, boostDays }, 'Listing boost fulfilled')
}

async function fulfillLeadCredits(payment: any) {
  const creditCount = payment.metadata.creditCount

  const agent = await prisma.agent.findUnique({
    where: { userId: payment.userId },
  })
  if (!agent) {
    throw new AppError(404, 'Agent not found')
  }

  // Add lead credits to agent
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      leadCredits: { increment: creditCount },
    },
  })

  logger.info({ paymentId: payment.id, agentId: agent.id, creditCount }, 'Lead credits fulfilled')
}

async function fulfillPropertyReservation(payment: any) {
  const propertyId = payment.metadata?.propertyId
  if (!propertyId) {
    logger.error({ paymentId: payment.id }, 'PROPERTY_RESERVATION missing propertyId in metadata')
    return
  }

  // Atomic update: mark property as RESERVED so it leaves public search and signals to agent
  const [property] = await prisma.$transaction([
    prisma.property.update({
      where: { id: propertyId },
      data: { status: 'RESERVED' },
    }),
  ])

  logger.info(
    { paymentId: payment.id, propertyId },
    'Property reservation fulfilled — status set to RESERVED'
  )

  // Fire-and-forget email to the listing agent
  if (property.agentId) {
    const [agent, buyer] = await Promise.all([
      prisma.agent.findUnique({
        where: { id: property.agentId },
        include: { user: true },
      }),
      prisma.user.findUnique({ where: { id: payment.userId } }),
    ])

    if (agent?.user && buyer) {
      sendPropertyReservationEmail({
        agentEmail: agent.user.email,
        agentName: agent.user.firstName,
        propertyTitle: property.title,
        buyerName: `${buyer.firstName} ${buyer.lastName}`,
        buyerEmail: buyer.email,
        buyerPhone: buyer.phone,
        locale: 'ar',
      }).catch(err => {
        logger.error(
          { error: err, paymentId: payment.id, propertyId },
          'Failed to send property reservation email to agent'
        )
      })
    }
  }
}

// ==========================================
// AGENT TRANSACTIONS (properties the agent listed)
// ==========================================

export async function getAgentTransactions(userId: string, pagination: PaginationQuery) {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  // Find agent record for this user
  const agent = await prisma.agent.findUnique({ where: { userId } })
  if (!agent) {
    throw new AppError(404, 'Agent profile not found')
  }

  // Get all property IDs owned by this agent
  const agentProperties = await prisma.property.findMany({
    where: { agentId: agent.id },
    select: { id: true },
  })
  const agentPropertyIds = new Set(agentProperties.map(p => p.id))

  if (agentPropertyIds.size === 0) {
    return {
      data: [],
      meta: { page, limit, total: 0, totalPages: 0 },
    }
  }

  // Fetch all reservation payments — filter in JS since metadata is JSON
  const allPayments = await prisma.payment.findMany({
    where: {
      purpose: 'PROPERTY_RESERVATION',
      status: 'CAPTURED',
    },
    orderBy: { createdAt: 'desc' },
  })

  // Filter to only payments for this agent's properties
  const agentPayments = allPayments.filter(p => {
    const propertyId = (p.metadata as Record<string, unknown>)?.propertyId
    return typeof propertyId === 'string' && agentPropertyIds.has(propertyId)
  })

  const total = agentPayments.length
  const paginatedPayments = agentPayments.slice(skip, skip + limit)

  // Resolve property details from metadata
  const propertyIds = [
    ...new Set(
      paginatedPayments
        .map(p => (p.metadata as Record<string, unknown>)?.propertyId)
        .filter((id): id is string => typeof id === 'string')
    ),
  ]

  const [properties, users] = await Promise.all([
    prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        price: true,
        images: { where: { isCover: true }, take: 1, select: { url: true } },
      },
    }),
    prisma.user.findMany({
      where: { id: { in: paginatedPayments.map(p => p.userId) } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    }),
  ])

  const propertyMap = new Map(properties.map(p => [p.id, p]))
  const userMap = new Map(users.map(u => [u.id, u]))

  return {
    data: paginatedPayments.map(p => {
      const prop = propertyMap.get((p.metadata as Record<string, unknown>)?.propertyId as string)
      const user = userMap.get(p.userId)
      return {
        id: p.id,
        propertyId: prop?.id ?? null,
        propertyTitle: prop?.title ?? null,
        propertySlug: prop?.slug ?? null,
        propertyStatus: prop?.status ?? null,
        propertyPrice: prop ? Number(prop.price) : 0,
        propertyImage: prop?.images?.[0]?.url ?? null,
        amountAed: Number(p.amountAed),
        status: p.status,
        buyerName: user ? `${user.firstName} ${user.lastName}` : null,
        buyerEmail: user?.email ?? null,
        buyerPhone: user?.phone ?? null,
        createdAt: p.createdAt.toISOString(),
      }
    }),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ==========================================
// PAYMENT HISTORY
// ==========================================

export async function getPaymentHistory(userId: string, pagination: PaginationQuery) {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where: { userId } }),
  ])

  return {
    data: data.map(toPaymentDTO),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ==========================================
// PLAN MANAGEMENT
// ==========================================

export async function getActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceAed: 'asc' },
  })
  return plans.map(toPlanDTO)
}

export async function getAgentSubscription(agentId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { agentId, status: 'ACTIVE' },
    include: { plan: true },
    orderBy: { currentPeriodEnd: 'desc' },
  })

  return subscription ? toSubscriptionDTO(subscription) : null
}

export async function getPaymentById(
  paymentId: string,
  userId: string,
  userRole: string | undefined
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  })

  if (!payment) {
    return null
  }

  // Only allow users to see their own payments (unless admin)
  if (payment.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You do not have permission to view this payment')
  }

  let refreshedPayment = payment

  if (payment.status === 'PENDING' && payment.provider === 'STRIPE') {
    refreshedPayment = await refreshStripeCheckoutSessionStatus(payment)
  }

  return toPaymentDTO(refreshedPayment)
}

/**
 * Refund a captured payment via Stripe Refunds API.
 * ADMIN may refund any payment; owners may refund their own CAPTURED payments.
 */
export async function refundPayment(
  paymentId: string,
  userId: string,
  userRole: string | undefined,
  reason?: string
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  })

  if (!payment) {
    throw new AppError(404, 'Payment not found')
  }

  if (payment.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You do not have permission to refund this payment')
  }

  if (payment.status !== 'CAPTURED') {
    throw new AppError(400, `Only CAPTURED payments can be refunded (status=${payment.status})`)
  }

  if (payment.provider !== 'STRIPE') {
    throw new AppError(400, `Unsupported payment provider for refund: ${payment.provider}`)
  }

  if (
    !payment.providerRef ||
    payment.providerRef.startsWith('pending-') ||
    payment.providerRef.startsWith('mock-')
  ) {
    throw new AppError(400, 'Payment has no Stripe Checkout Session reference to refund')
  }

  logger.info(
    {
      paymentId: payment.id,
      amountAed: Number(payment.amountAed),
      purpose: payment.purpose,
    },
    'Payment refund initiating'
  )

  const stripeResult = await refundStripePayment({
    providerRef: payment.providerRef,
    amountAed: Number(payment.amountAed),
    reason,
  })

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'REFUNDED',
      metadata: {
        ...((payment.metadata as Record<string, unknown>) || {}),
        refund: {
          refundId: stripeResult.refundId,
          status: stripeResult.status,
          reason: reason || null,
          refundedAt: new Date().toISOString(),
        },
      },
    },
  })

  logger.info(
    {
      paymentId: payment.id,
      refundId: stripeResult.refundId,
    },
    'Payment refund recorded'
  )

  return toPaymentDTO(updated)
}
