import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as adminController from './admin.controller'

const router: Router = Router()

// All routes require ADMIN role
router.get(
  '/dashboard/stats',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(adminController.getDashboardStats)
)
router.get(
  '/activity',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(adminController.getRecentActivity)
)
router.get('/users', requireAuth, requireRole('ADMIN'), catchAsync(adminController.listUsers))
router.patch(
  '/users/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(adminController.updateUserStatus)
)
router.patch(
  '/properties/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(adminController.reviewPropertyStatus)
)
router.get(
  '/properties/pending',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(adminController.listPendingProperties)
)

export default router
