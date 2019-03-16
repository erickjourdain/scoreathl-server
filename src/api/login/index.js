import { Router } from 'express'
import { password, google, facebook } from '../../services/passport'

import { login } from './controller'

const router = new Router()

router.post('/password', 
  password(),
  login)

router.post('/facebook', 
  facebook(),
  login)

router.post('/google', 
  google(),
  login)

export default router
