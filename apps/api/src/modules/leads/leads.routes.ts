import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as leadsController from './leads.controller'

const router: Router = Router()

// Public route with optional auth (guest submissions allowed)
router.post('/', catchAsync(leadsController.create))

// Protected routes — agent/admin only
router.get(
  '/',
  requireAuth,
  requireRole('AGENT', 'AGENCY_ADMIN', 'ADMIN'),
  catchAsync(leadsController.list)
)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('AGENT', 'AGENCY_ADMIN', 'ADMIN'),
  catchAsync(leadsController.updateStatus)
)

export default router
