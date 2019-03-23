import passport from 'passport'
import { string, object } from 'yup'
import { BasicStrategy } from 'passport-http'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'

import * as facebookService from '../facebook'
import * as googleService from '../google'
import db from '../../models'

import config from '../../config'

export const password = () => (req, res, next) =>
  passport.authenticate('password', { session: false }, (err, user, info) => {
    if (err && err.param) {
      return res.status(400).json(err)
    } else if (err || !user) {
      return res.status(401).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  })(req, res, next)

export const token = ({ required, roles = User.roles } = {}) => (req, res, next) =>
  passport.authenticate('token', { session: false }, (err, user, info) => {
    if (err || (required && !user) || (required && !~roles.indexOf(user.role))) {
      return res.status(401).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  })(req, res, next)

export const facebook = () =>
  passport.authenticate('facebook', { session: false })

export const google = () =>
  passport.authenticate('google', { session: false })

export const master = () =>
  passport.authenticate('master', { session: false })

export const jwt = () => (req, res, next) => {
  passport.authenticate('token', { session: false }, (err, user, info) => {
    req.user = user || null
    next()
  })(req, res, next)
}
 
passport.use('password', new BasicStrategy(async (nom, password, done) => {
  try {
    var userSchema = object().shape({
      nom: string().required(),
      password: string().required()
    })
  
    await userSchema.isValid({ nom, password})
  
    db.User.findOne({ nom }).then((user) => {
      if (!user) {
        done(true)
        return null
      }
      return user.authenticate(password, user.password).then((user) => {
        done(null, user)
        return null
      }).catch(done)
    })  
  }
  catch (err) {
    done(err)
  }
}))

passport.use('google', new BearerStrategy((token, done) => {
  console.log(token)
  googleService.getUser(token).then((user) => {
    console.log(user)
    return User.createFromService(user)
  }).then((user) => {
    done(null, user)
    return null
  }).catch(done)
}))

passport.use('facebook', new BearerStrategy((token, done) => {
  console.log(token)
  facebookService.getUser(token).then((user) => {
    console.log(user)
    return User.createFromService(user)
  }).then((user) => {
    done(null, user)
    return null
  }).catch(done)
}))

passport.use('master', new BearerStrategy((token, done) => {
  if (token === config.get('secret').master) {
    done(null, {})
  } else {
    done(null, false)
  }
}))

passport.use('token', new JwtStrategy({
  secretOrKey: config.get('secret').jwt,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromUrlQueryParameter('access_token'),
    ExtractJwt.fromBodyField('access_token'),
    ExtractJwt.fromAuthHeaderWithScheme('Bearer')
  ])
}, ({ id }, done) => {
  db.User.findByPk(id).then((user) => {
    done(null, user)
    return null
  }).catch(done)
}))
