import { Router } from 'express'
import { catchAsync } from '../../utils/catchAsync'
import * as authController from './auth.controller'

const router: Router = Router()

router.post('/register', catchAsync(authController.register))
router.post('/login', catchAsync(authController.login))
router.post('/refresh', catchAsync(authController.refresh))
router.post('/logout', catchAsync(authController.logout))

export default router
