import express, { type Request, type Response, type NextFunction } from 'express'
import { env } from './config/env'
import { prisma } from './lib/prisma'
import { AppError } from './utils/AppError'
import { authLimiter, generalLimiter } from './middleware/rateLimiter'
import { logger } from './lib/logger'
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

const app = express()

// ==========================================
// Global Middleware
// ==========================================
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
  logger.error(err.stack)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
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
  await prisma.$disconnect()
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
})
