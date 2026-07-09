import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as agentsController from './agents.controller'

const router: Router = Router()

router.post('/apply', requireAuth, catchAsync(agentsController.apply))
router.get('/applications', requireAuth, requireRole('ADMIN'), catchAsync(agentsController.list))
router.post(
  '/applications/:id/review',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(agentsController.review)
)

export default router
