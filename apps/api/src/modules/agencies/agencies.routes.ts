import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as agenciesController from './agencies.controller'

const router: Router = Router()

router.get('/', catchAsync(agenciesController.list))
router.get('/:id', catchAsync(agenciesController.getOne))

// Admin-only routes
router.post('/', requireAuth, requireRole('ADMIN'), catchAsync(agenciesController.create))
router.patch('/:id', requireAuth, requireRole('ADMIN'), catchAsync(agenciesController.update))
router.patch('/:id/verify', requireAuth, requireRole('ADMIN'), catchAsync(agenciesController.verify))
router.delete('/:id', requireAuth, requireRole('ADMIN'), catchAsync(agenciesController.remove))

export default router
