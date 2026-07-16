import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as availabilityController from './availability.controller'

const router: Router = Router()

router.get('/public/:agentId', catchAsync(availabilityController.getPublicAvailability))

router.use(requireAuth, requireRole('AGENT', 'AGENCY_ADMIN'))
router.get('/', catchAsync(availabilityController.getAvailability))
router.put('/', catchAsync(availabilityController.setAvailability))

export default router
