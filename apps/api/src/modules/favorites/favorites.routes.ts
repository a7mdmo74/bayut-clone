import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import * as favoritesController from './favorites.controller'

const router: Router = Router()

// All routes require auth
router.post('/:propertyId', requireAuth, catchAsync(favoritesController.add))
router.delete('/:propertyId', requireAuth, catchAsync(favoritesController.remove))
router.get('/', requireAuth, catchAsync(favoritesController.list))

export default router
