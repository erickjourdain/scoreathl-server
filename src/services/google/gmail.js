import nodemailer from 'nodemailer'
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

export default transporter
