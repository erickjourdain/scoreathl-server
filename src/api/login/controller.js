import request from 'request-promise'
import * as facebookService from '../../services/facebook'
import * as googleService from '../../services/google'
import { sign } from '../../services/jwt'
import { success } from '../../services/response/'
import Models from '../../models'

import config from '../../config'

export const login = ({ user }, res, next) => {
  sign(user.id)
    .then((token) => ({ token, user: user.view(true) }))
    .then(success(res, 201))
    .catch(next)
}

export const authFacebook = async (req, res, next) => {
  try {
    const response = await request({
      method: 'POST',
      uri: 'https://graph.facebook.com/v2.4/oauth/access_token',
      body: {
        client_id: config.auth.facebook.clientId,
        client_secret: config.auth.facebook.clientSecret,
        code: req.body.code,
        redirect_uri: req.body.redirectUri
      },
      json: true
    })
    let user = await facebookService.getUser(response.access_token)
    user = await Models.User.createFromService(user)
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  } catch (err) {
    next(err)
  }
}

export const authGoogle = async (req, res, next) => {
  try {
    const response = await request({
      method: 'POST',
      uri: 'https://accounts.google.com/o/oauth2/token',
      form: {
        client_id: config.auth.google.clientId,
        client_secret: config.auth.google.clientSecret,
        code: req.body.code,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    })
    let user = await googleService.getUser(JSON.parse(response).access_token)
    user = await Models.User.createFromService(user)
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  } catch (err) {
    next(err)
  }
}
