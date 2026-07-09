import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import * as uploadsController from './uploads.controller'

const router: Router = Router()
router.post('/presign', requireAuth, catchAsync(uploadsController.presign))
router.get('/presign', requireAuth, catchAsync(uploadsController.presignGet))
router.get('/files/*', catchAsync(uploadsController.serveFile)) // Public endpoint for serving files
export default router
