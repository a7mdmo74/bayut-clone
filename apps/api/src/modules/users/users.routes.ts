import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import * as usersController from './users.controller'

const router: Router = Router()

// All user routes require authentication
router.get('/me', requireAuth, catchAsync(usersController.getProfile))
router.patch('/me', requireAuth, catchAsync(usersController.updateProfile))
router.patch('/me/password', requireAuth, catchAsync(usersController.changePassword))

export default router