import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'

// ==========================================
// LISTING EXPIRY
// ==========================================

export async function expireStaleListings() {
  try {
    const result = await prisma.property.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { not: null, lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    })

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Expired stale listings')
    }
    return result.count
  } catch (err) {
    logger.error({ err }, 'Failed to expire stale listings')
    return 0
  }
}

// ==========================================
// TOKEN CLEANUP
// ==========================================

export async function cleanupExpiredTokens() {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revoked: true },
        ],
      },
    })

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Cleaned up expired/revoked tokens')
    }
    return result.count
  } catch (err) {
    logger.error({ err }, 'Failed to cleanup tokens')
    return 0
  }
}

// ==========================================
// SUBSCRIPTION CHECK
// ==========================================

export async function checkExpiredSubscriptions() {
  try {
    const result = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    })

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Marked expired subscriptions')
    }
    return result.count
  } catch (err) {
    logger.error({ err }, 'Failed to check subscriptions')
    return 0
  }
}

// ==========================================
// RUN ALL CRON JOBS
// ==========================================

export async function runAllCronJobs() {
  logger.info('Running scheduled cron jobs')
  const results = await Promise.allSettled([
    expireStaleListings(),
    cleanupExpiredTokens(),
    checkExpiredSubscriptions(),
  ])

  const summary = results.map((r, i) => ({
    job: ['expireListings', 'cleanupTokens', 'checkSubscriptions'][i],
    status: r.status,
    result: r.status === 'fulfilled' ? r.value : r.reason?.message,
  }))

  logger.info({ summary }, 'Cron jobs completed')
  return summary
}
