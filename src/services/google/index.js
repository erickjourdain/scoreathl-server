import request from 'request-promise'
import nodemailer from 'nodemailer'
import { object, string } from 'yup'

import config from '../../config'

const googleAuth = config.get('auth').google

const auth = {
  type: 'oauth2',
  user: 'ricoudj@gmail.com',
  clientId: googleAuth.clientId,
  clientSecret: googleAuth.clientSecret,
  refreshToken: googleAuth.refreshToken
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: auth,
  tls: {
    rejectUnauthorized: false
  }
})

const getUser = (accessToken) =>
  request({
    uri: 'https://www.googleapis.com/userinfo/v2/me',
    json: true,
    qs: {
      access_token: accessToken
    }
  }).then(async ({ id, name, email, picture }) => {
    try {
      const schema = object().shape({
        id: string().required(),
        name: string().required(),
        email: string().email(),
        picture: string().required()
      })
      await schema.validate({ id, name, email, picture })
      return ({
        service: 'google',
        picture,
        id,
        name,
        email
      })
    } catch (err) {
      throw err
    }
  })

export {
  getUser,
  transporter
}
