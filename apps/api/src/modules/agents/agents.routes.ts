import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as agentsController from './agents.controller'

const router: Router = Router()

// Agent-specific routes
router.get(
  '/dashboard/stats',
  requireAuth,
  requireRole('AGENT'),
  catchAsync(agentsController.getDashboardStats)
)
router.get(
  '/properties',
  requireAuth,
  requireRole('AGENT'),
  catchAsync(agentsController.getProperties)
)

// Agent profile routes
router.get('/me', requireAuth, requireRole('AGENT'), catchAsync(agentsController.getAgentProfile))
router.patch('/me', requireAuth, requireRole('AGENT'), catchAsync(agentsController.updateAgentProfile))

// Application routes
router.post('/apply', requireAuth, catchAsync(agentsController.apply))
router.get('/applications', requireAuth, requireRole('ADMIN'), catchAsync(agentsController.list))
router.post(
  '/applications/:id/review',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(agentsController.review)
)

// Public agent profile
router.get('/:id/public', catchAsync(agentsController.getPublicProfile))

export default router
