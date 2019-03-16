import { Router } from 'express'
import { master } from '../../services/passport'

import { createUser, initialise } from './controller'

const router = new Router()

router.post('/', 
  master(),
  createUser,
  initialise)

export default router
