import { Router } from 'express'

import initialise from './initialise'
import login from './login'

const router = new Router()

router.use('/app_init', initialise)
router.use('/login', login)

export default router
