import request from 'request-promise'
import { object, string } from 'yup'

export const getUser = (accessToken) =>
  request({
    uri: 'https://graph.facebook.com/me',
    json: true,
    qs: {
      access_token: accessToken,
      fields: 'id, name, email, picture'
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
        service: 'facebook',
        picture: picture.data.url,
        id,
        name,
        email
      })
    } catch (err) {
      throw err
    }
  })
