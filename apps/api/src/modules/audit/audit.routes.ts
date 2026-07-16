import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth, requireRole } from '../../middleware/requireAuth'
import * as auditController from './audit.controller'

const router: Router = Router()

router.use(requireAuth, requireRole('ADMIN'))
router.get('/', catchAsync(auditController.getAuditLogs))

export default router
