import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import * as savedSearchesController from './saved-searches.controller'

const router: Router = Router()

// All routes require auth
router.post('/', requireAuth, catchAsync(savedSearchesController.create))
router.get('/', requireAuth, catchAsync(savedSearchesController.list))
router.delete('/:id', requireAuth, catchAsync(savedSearchesController.remove))

export default router
