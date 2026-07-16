import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import * as cronController from './cron.controller'

const router: Router = Router()

router.get('/health', catchAsync(cronController.healthCheck))
router.post('/run', catchAsync(cronController.runCronJobs))

export default router
