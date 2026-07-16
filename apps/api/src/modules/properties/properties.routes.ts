import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as propertiesController from './properties.controller'

const router: Router = Router()

// Public routes — no auth needed, buyers browse freely
router.get('/featured', catchAsync(propertiesController.getFeatured))
router.get('/', catchAsync(propertiesController.search))
router.get('/:slug', catchAsync(propertiesController.getOne))

// Protected routes — only logged-in agents/agency admins can create
router.post(
  '/',
  requireAuth,
  requireRole('AGENT', 'AGENCY_ADMIN', 'ADMIN'),
  catchAsync(propertiesController.create)
)
router.post('/:id/images', requireAuth, catchAsync(propertiesController.addImage))
router.patch('/:id', requireAuth, catchAsync(propertiesController.update))
router.delete('/:id', requireAuth, catchAsync(propertiesController.remove))

export default router
