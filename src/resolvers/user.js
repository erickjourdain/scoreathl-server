import { AuthenticationError, ApolloError } from 'apollo-server'
import { object, string } from 'yup'
import { map, forOwn } from 'lodash'

import { sign } from '../services/jwt'
import * as googleService from '../services/google'
import * as facebookService from '../services/facebook'
 
export default {
  Query: {
    me: (parent, args, { user }) => {
      return user
    },
    user: async (parent, { id }, { models, user }) => {
      const requestedUser = await models.User.findById(id)
      return (user && user.role === 'admin') ? requestedUser.view(true) : requestedUser.view()
    },
    users: async (parent, args, { models, user }) => {
      const users = await models.User.find({})
      return map(users, u => {
        return (user && user.role === 'admin') ? u.view(true) : u.view()
      })
    },
    usersRole: async (parent, args, { models }) => {
      const usersRole = []
      for (let role of args.roles) {
        const users = await models.User.find({ role })
        map(users, u => usersRole.push(u))
      }
      return usersRole
    }
  },
  Mutation: {
    creerUser: async (parent, args, { models, user }) => {
      const schema = object().shape({
        nom: string().required().min(3, `Le nom de l'athlète' doit comporter au moins 3 caractères.`),
        email: string().required().email(),
        password: string().required().min(5, `Le mot de passe doit comporter au moins 5 caractères.`),
        role: string().oneOf(['admin', 'organisateur', 'juge', 'athlète'], `Le rôle n'est pas un rôle valide.`),
        avatar: string()
      })
      await schema.validate(args)
      if (args.role && args.role !== 'athlète' && ((!user) || (user.role !== 'admin'))) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const newUser = await models.User.create(args)
      return newUser.view(true)
    },
    majUser: async (parent, args, { models, user }) => {
      const schema = object().shape({
        id: string().required(),
        nom: string().min(3, `Le nom de l'athlète' doit comporter au moins 3 caractères.`),
        email: string().email(),
        role: string().oneOf(['admin', 'organisateur', 'juge', 'athlète'], `Le rôle n'est pas un rôle valide.`),
        avatar: string()
      })
      await schema.validate(args)
      const requestedUser = await models.User.findById(args.id)
      if (!user || (user.role !== 'admin' && user.id !== requestedUser.id)) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      if (requestedUser.role === 'admin' && args.role && args.role !== 'admin') {
        const admin = models.User.findOne({ $and: [{ $ne: { _id: args.id} }, { role: 'admin' }] })
        if (admin) {
          throw new ApolloError(`Impossible d'effectuer l'opération. ${requestedUser.nom} est le dernier administrateur de l'application.`)
        }
      }
      forOwn(args, (value, key) => {
        requestedUser[key] = value
      })
      await requestedUser.save()
      return requestedUser.view(true)
    },
    loginPassword: async (parent, args, { models }) => {
      const schema = object().shape({
        nom: string().min(3, `Le nom de l'athlète' doit comporter au moins 3 caractères.`),
        password: string().required().min(5, `Le mot de passe doit comporter au moins 5 caractères.`)
      })
      await schema.validate(args)
      const user = await models.User.findOne({ nom: args.nom })
      if (!user) {
        throw new Error('Aucun utilisateur enregistré avec ce nom.')
      }
      if (!user.authenticate(args.password, user.password)) {
        throw new Error(`Erreur d'indentification.`)
      }
      const token = await sign(user.id)
      return { user: user.view(true), token }
    },
    loginGoogle: async (parent, { token }, { models }) => {
      const googleUser = await googleService.getUser(token)
      if (!googleUser) {
        throw new Error('Aucun utilisateur enregistré avec ce nom.')
      }
      const user = await models.User.createFromService(googleUser)
      const userToken = await sign(user.id)
      return { user: user.view(true), token: userToken}
    },
    loginFacebook: async (parent, { token }, { models }) => {
      const facebookUser = await facebookService.getUser(token)
      if (!facebookUser) {
        throw new Error('Aucun utilisateur enregistré avec ce nom.')
      }
      const user = await models.User.createFromService(facebookUser)
      const userToken = await sign(user.id)
      return { user: user.view(true), token: userToken}
    }
  }
}
