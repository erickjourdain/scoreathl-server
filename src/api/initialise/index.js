import { Router } from 'express'
import { master } from '../../services/passport'
import { success } from '../../services/response'

import { createDatabase, createUser, initialise, seed } from './controller'

const router = new Router()

router.post('/', 
  master(),
  createDatabase,
  createUser,
  initialise,
  (req, res, next) => success(res, 201)({ app_init: true })
)

router.post('/seed', 
  master(),
  createDatabase,
  createUser,
  initialise,
  seed,
  (req, res, next) => success(res, 201)({ seed: true })
)

export default router
