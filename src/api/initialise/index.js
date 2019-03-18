import { Router } from 'express'
import { master } from '../../services/passport'
import { success } from '../../services/response'

import { createDatabase, createUser, initialise } from './controller'

const router = new Router()

router.post('/', 
  master(),
  createDatabase,
  createUser,
  initialise,
  (req, res, next) => success(res, 201)({ app_init: true })
)

export default router
