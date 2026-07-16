import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import { requireAuth } from '../../middleware/requireAuth'
import * as notificationsController from './notifications.controller'

const router: Router = Router()

router.use(requireAuth)

router.get('/', catchAsync(notificationsController.getNotifications))
router.get('/unread-count', catchAsync(notificationsController.getUnreadCount))
router.patch('/:id/read', catchAsync(notificationsController.markAsRead))
router.patch('/read-all', catchAsync(notificationsController.markAllAsRead))
router.delete('/:id', catchAsync(notificationsController.deleteNotification))

export default router
