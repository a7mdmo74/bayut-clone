import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import * as reviewsController from './reviews.controller'

const router: Router = Router()

router.get('/agent/:agentId', catchAsync(reviewsController.getAgentReviews))
router.post('/', requireAuth, catchAsync(reviewsController.createReview))
router.delete('/:id', requireAuth, catchAsync(reviewsController.deleteReview))

export default router
