import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import * as locationsController from './locations.controller'

const router: Router = Router()

// All routes are public — no auth required
router.get('/emirates', catchAsync(locationsController.listEmirates))
router.get('/emirates/:emirateId/communities', catchAsync(locationsController.listCommunities))
router.get('/communities/:communityId/sub-communities', catchAsync(locationsController.listSubCommunities))

export default router
