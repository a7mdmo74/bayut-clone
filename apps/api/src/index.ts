import express, { type Request, type Response, type NextFunction } from 'express'
import helmet from 'helmet'
import { env } from './config/env'
import { isStripeConfigured } from './lib/stripe'
import { disconnectPrisma, prisma } from './lib/prisma'
import { AppError } from './utils/AppError'
import { generalLimiter } from './middleware/rateLimiter'
import { logger } from './lib/logger'
import { catchAsync } from './utils/catchAsync'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import { openApiSchema } from './lib/openapi'
import authRoutes from './modules/auth/auth.routes'
import propertiesRoutes from './modules/properties/properties.routes'
import agentsRoutes from './modules/agents/agents.routes'
import uploadsRoutes from './modules/uploads/uploads.routes'
import favoritesRoutes from './modules/favorites/favorites.routes'
import savedSearchesRoutes from './modules/saved-searches/saved-searches.routes'
import leadsRoutes from './modules/leads/leads.routes'
import locationsRoutes from './modules/locations/locations.routes'
import amenitiesRoutes from './modules/amenities/amenities.routes'
import adminRoutes from './modules/admin/admin.routes'
import paymentsRoutes from './modules/payments/payments.routes'
import * as paymentsController from './modules/payments/payments.controller'
import viewingsRoutes from './modules/viewings/viewings.routes'
import usersRoutes from './modules/users/users.routes'
import notificationsRoutes from './modules/notifications/notifications.routes'
import reviewsRoutes from './modules/reviews/reviews.routes'
import agenciesRoutes from './modules/agencies/agencies.routes'
import availabilityRoutes from './modules/availability/availability.routes'
import cronRoutes from './modules/cron/cron.routes'
import { runAllCronJobs } from './modules/cron/cron.service'
import auditRoutes from './modules/audit/audit.routes'

const app = express()

// ==========================================
// Global Middleware
// ==========================================

// Security headers with API-appropriate CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // API-only: no scripts/styles needed, strict policy
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow API usage from different origins
  })
)

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = env.CORS_ORIGIN
  if (origin !== '*') {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Stripe webhook MUST receive the raw body for signature verification.
// Register before express.json() so the body is not parsed as JSON first.
app.post(
  '/payments/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  catchAsync(paymentsController.stripeWebhook)
)

app.use(express.json())
app.use(pinoHttp({ logger }))
app.use(generalLimiter)

// ==========================================
// Routes
// ==========================================
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Bayut Clone API',
    version: '0.1.0',
    status: 'running',
  })
})

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT NOW()`
    res.json({
      status: 'ok',
      database: 'connected',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Feature routes
app.use('/auth', authRoutes)
app.use('/properties', propertiesRoutes)
app.use('/agents', agentsRoutes)
app.use('/uploads', uploadsRoutes)
app.use('/favorites', favoritesRoutes)
app.use('/saved-searches', savedSearchesRoutes)
app.use('/leads', leadsRoutes)
app.use('/locations', locationsRoutes)
app.use('/amenities', amenitiesRoutes)
app.use('/admin', adminRoutes)
app.use('/payments', paymentsRoutes)
app.use('/viewings', viewingsRoutes)
app.use('/users', usersRoutes)
app.use('/notifications', notificationsRoutes)
app.use('/reviews', reviewsRoutes)
app.use('/agencies', agenciesRoutes)
app.use('/availability', availabilityRoutes)
app.use('/cron', cronRoutes)
app.use('/audit', auditRoutes)

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSchema))
// ==========================================
// 404 handler — must come after all real routes
// ==========================================
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// ==========================================
// Centralized error handler — must be registered LAST
// ==========================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    {
      err,
      name: err.name,
      message: err.message,
      ...(typeof (err as { code?: string }).code === 'string'
        ? { code: (err as { code?: string }).code }
        : {}),
      ...(typeof (err as { meta?: unknown }).meta !== 'undefined'
        ? { meta: (err as { meta?: unknown }).meta }
        : {}),
    },
    'Unhandled API error'
  )

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  const code = (err as { code?: string }).code
  if (code === 'ETIMEDOUT' || code === 'P1001' || code === 'P1008') {
    return res.status(503).json({
      error: 'Database temporarily unavailable. Please try again.',
    })
  }

  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// ==========================================
// Graceful shutdown
// ==========================================
async function shutdown() {
  logger.info('Shutting down gracefully...')
  await disconnectPrisma()
  await logger.flush()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// ==========================================
// Start server
// ==========================================
app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}`)
  logger.info(`📊 Health check: http://localhost:${env.PORT}/health`)
  logger.info(`📚 API Documentation: http://localhost:${env.PORT}/docs`)
  logger.info(
    {
      credentialsConfigured: isStripeConfigured(),
      webhookPath: '/payments/webhooks/stripe',
    },
    'Stripe payment configuration'
  )

  // Run cron jobs every hour (only in production or when CRON_SECRET is set)
  if (env.NODE_ENV === 'production' || process.env.CRON_SECRET) {
    setInterval(() => {
      runAllCronJobs().catch(err => {
        logger.error({ err }, 'Cron job execution failed')
      })
    }, 60 * 60 * 1000) // Every hour
    logger.info('⏰ Cron scheduler started (hourly)')
  }
})
