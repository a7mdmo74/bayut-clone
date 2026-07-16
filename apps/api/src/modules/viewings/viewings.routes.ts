import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import * as viewingsController from './viewings.controller'

const router: Router = Router()

// All viewing routes require authentication
router.post('/', requireAuth, catchAsync(viewingsController.request))
router.get('/my', requireAuth, catchAsync(viewingsController.getMyViewings))
router.get('/agent', requireAuth, catchAsync(viewingsController.getAgentViewings))
router.get('/:id', requireAuth, catchAsync(viewingsController.getOne))
router.patch('/:id/cancel', requireAuth, catchAsync(viewingsController.cancel))
router.patch('/:id/status', requireAuth, catchAsync(viewingsController.updateStatus))

export default router
