import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as amenitiesController from './amenities.controller'

const router: Router = Router()

// Public route — anyone can list amenities for filter UI
router.get('/', catchAsync(amenitiesController.list))

// Protected route — only ADMIN can create amenities
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(amenitiesController.create)
)

export default router
