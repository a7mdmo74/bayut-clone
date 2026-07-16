import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import { paymentLimiter } from '../../middleware/rateLimiter'
import * as paymentsController from './payments.controller'

const router: Router = Router()

// Protected routes - require authentication
router.post('/checkout', requireAuth, paymentLimiter, catchAsync(paymentsController.createCheckout))
router.get('/history', requireAuth, catchAsync(paymentsController.getHistory))
router.get('/agent-transactions', requireAuth, catchAsync(paymentsController.getAgentTransactions))
router.get('/plans', catchAsync(paymentsController.getPlans)) // Public - agents can see plans before signing up
router.get('/subscription', requireAuth, catchAsync(paymentsController.getSubscription))
router.post('/:id/refund', requireAuth, catchAsync(paymentsController.refundPayment))
router.get('/:id', requireAuth, catchAsync(paymentsController.getPaymentById))

// Stripe webhook is registered in index.ts BEFORE express.json() so the raw body
// is preserved for signature verification. Do not add /webhooks/stripe here.

export default router
