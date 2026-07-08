import express, { type Request, type Response, type NextFunction } from 'express'
import { env } from './config/env'
import { prisma } from './lib/prisma'
import { AppError } from './utils/AppError'
import authRoutes from './modules/auth/auth.routes'

const app = express()

// ==========================================
// Global Middleware
// ==========================================
app.use(express.json())

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
  console.error(err.stack)

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
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// ==========================================
// Start server
// ==========================================
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`)
  console.log(`📊 Health check: http://localhost:${env.PORT}/health`)
})
