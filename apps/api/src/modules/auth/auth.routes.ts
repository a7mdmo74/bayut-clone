import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import { authLimiter } from '../../middleware/rateLimiter'
import * as authController from './auth.controller'

const router: Router = Router()

// Apply strict rate limiting to login and register
router.post('/register', authLimiter, catchAsync(authController.register))
router.post('/login', authLimiter, catchAsync(authController.login))
router.post('/refresh', catchAsync(authController.refresh))
router.post('/logout', catchAsync(authController.logout))
router.get('/me', requireAuth, catchAsync(authController.me))

// Password reset routes
router.post('/forgot-password', authLimiter, catchAsync(authController.forgotPassword))
router.post('/reset-password', catchAsync(authController.resetPassword))

// Email verification routes
router.post('/send-verification', requireAuth, catchAsync(authController.sendVerification))
router.post('/verify-email', catchAsync(authController.verifyEmail))

export default router
