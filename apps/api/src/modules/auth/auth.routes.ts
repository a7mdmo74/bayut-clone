import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { authLimiter } from '../../middleware/rateLimiter'
import * as authController from './auth.controller'

const router: Router = Router()

// Apply strict rate limiting to login and register
router.post('/register', authLimiter, catchAsync(authController.register))
router.post('/login', authLimiter, catchAsync(authController.login))
router.post('/refresh', catchAsync(authController.refresh))
router.post('/logout', catchAsync(authController.logout))

export default router
