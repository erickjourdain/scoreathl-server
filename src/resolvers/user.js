import { AuthenticationError, ApolloError } from 'apollo-server'
import { object, string, mixed } from 'yup'
import { map, forOwn } from 'lodash'
import { Op } from 'sequelize'
import uuid from 'uuid/v4'

import config from '../config'
import pubsub, { EVENTS } from '../subscription'
import { sign } from '../services/jwt'
import hash from '../services/hash'
import storeFS from '../services/store/storeFS'
import * as googleService from '../services/google'
import * as facebookService from '../services/facebook'
 
export default {
  Query: {
    me: (parent, args, { user }) => {
      return user
    },
    user: async (parent, { id }, { db, user }) => {
      const requestedUser = await db.User.findByPk(id)
      return (user && user.role === 'admin') ? requestedUser.view(true) : requestedUser.view()
    },
    users: async (parent, args, { db, user }) => {
      const users = await db.User.findAll()
      return map(users, u => {
        return (user && user.role === 'admin') ? u.view(true) : u.view()
      })
    },
    usersRole: async (parent, args, { db }) => {
      const usersRole = []
      for (let role of args.roles) {
        const users = await db.User.find({ where: { role } })
        map(users, u => usersRole.push(u))
      }
      return usersRole
    }
  },
  Mutation: {
    creerUser: async (parent, args, { db, user }) => {
      const schema = object().shape({
        nom: string().required().min(3, `Le nom de l'athlète' doit comporter au moins 3 caractères.`),
        email: string().required().email(),
        password: string().required().min(5, `Le mot de passe doit comporter au moins 5 caractères.`),
        role: string().oneOf(['admin', 'organisateur', 'juge', 'athlète'], `Le rôle n'est pas un rôle valide.`),
        avatar: mixed()
      })
      await schema.validate(args)
      if (args.role && args.role !== 'athlète' && ((!user) || (user.role !== 'admin'))) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }

      if (args.avatar) {
        const { createReadStream, filename, mimetype } = await args.avatar
        const stream = createReadStream()
        const { imagename } = await storeFS({ stream, filename })
        args.avatar = imagename
      }

      args.nom = args.nom.trim()
      args.password = await hash(args.password)

      const newUser = await db.User.create(args)
      pubsub.publish(EVENTS.USER.NOUVEAU, { nouveauUser: newUser.view() })
      return newUser.view(true)
    },
    majUser: async (parent, args, { db, user }) => {
      const schema = object().shape({
        id: string().required(),
        nom: string().min(3, `Le nom de l'athlète' doit comporter au moins 3 caractères.`),
        email: string().email(),
        role: string().oneOf(['admin', 'organisateur', 'juge', 'athlète'], `Le rôle n'est pas un rôle valide.`),
        avatar: string()
      })
      await schema.validate(args)
      const requestedUser = await db.User.findByPk(args.id)
      if (!user || (user.role !== 'admin' && user.id !== requestedUser.id)) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      if (requestedUser.role === 'admin' && args.role && args.role !== 'admin') {
        const admin = db.User.findOne({ [Op.and]: [{ [Op.ne]: { id: args.id} }, { role: 'admin' }] })
        if (admin) {
          throw new ApolloError(`Impossible d'effectuer l'opération. ${requestedUser.nom} est le dernier administrateur de l'application.`)
        }
      }
      if (args.nom) args.nom = args.nom.trim()

      await db.User.update(args, { where: { id: args.id } })
      const modificationUser = await db.User.findByPk(args.id)
      pubsub.publish(EVENTS.USER.MODIFICATION, { modificationUser: modificationUser.view() })
      return modificationUser.view(true)
    },
    loginPassword: async (parent, args, { db }) => {
      const schema = object().shape({
        nom: string().min(3, `Le nom de l'athlète' doit comporter au moins 3 caractères.`),
        password: string().required().min(5, `Le mot de passe doit comporter au moins 5 caractères.`)
      })
      await schema.validate(args)
      const user = await db.User.findOne({ where: { nom: args.nom } })
      if (!user) {
        throw new ApolloError('Aucun utilisateur enregistré avec ce nom.')
      }
      const valid = await user.authenticate(args.password)
      if (!valid) {
        throw new AuthenticationError(`Erreur d'indentification.`)
      }
      const token = await sign(user.id)
      return { user: user.view(true), token }
    },
    loginGoogle: async (parent, { token }, { db }) => {
      try {
        if (!token) {
          throw new ApolloError('Aucun token fourni.')
        }
        const googleUser = await googleService.getUser(token)
        if (!googleUser) {
          throw new ApolloError('Impossible de se connecter avec l\'identifiant Google.')
        }
        const user = await db.User.createFromService(googleUser)
        const userToken = await sign(user.id)
        return { user: user.view(true), token: userToken}
      } catch (err) {
        throw err
      }
    },
    loginFacebook: async (parent, { token }, { db }) => {
        try {
        if (!token) {
          throw new ApolloError('Aucun token fourni.')
        }
        const facebookUser = await facebookService.getUser(token)
        if (!facebookUser) {
          throw new ApolloError('Impossible de se connecter avec l\'identifiant Facebook.')
        }
        const user = await db.User.createFromService(facebookUser)
        const userToken = await sign(user.id)
        return { user: user.view(true), token: userToken}
        } catch (err) {
          throw err
        }
    },
    forgetPwd: async (parent, { email }, { db }) => {
      try {
        if (!email) {
          throw new ApolloError('Aucun email fourni.')
        }
        const user = await db.User.findOne({ where:  { email } })
        if (!user) {
          throw new ApolloError(`Aucun utilisateur dans la base avec cet email ${email}.`)
        }
        let dt = new Date()
        dt.setHours( dt.getHours() + 2 )
        let id = uuid()
        await user.update({
          resetpwdtoken: id,
          validtoken: dt
        })
        const mailOptions = {
          to: email,
          subject: 'ScoreAthl changement mot de passe',
          text: `Merci de copier le lien suivant ${config.get('url')}/resetpwd/${id} et coller le dans votre navigateur pour changer votre mot de passe`,
          html: `Ce message vous est envoyé suite à votre demande de changement de mot de passe.<br>
            <br>Cliquez sur le lien ci-dessous pour changer votre mot de passe.<br>
            <a href="${config.get('url')}/resetpwd/${id}">${config.get('url')}/resetpwd/${id}</a><br>
            <br>Ce lien est actif durant les deux prochaines heures.<br>
            Merci et à bientôt sur ScoreAthl<br>
            <br>Christope.`,
        }
        await googleService.transporter.sendMail(mailOptions)
      } catch (err) {
        throw err
      }
    },
    resetPwd: async (parent, args, { db }) => {
      try {
        const schema = object().shape({
          token: string().required(),
          password: string().required().min(5, `Le mot de passe doit comporter au moins 5 caractères.`)
        })
        await schema.validate(args)
        const user = await db.User.findOne({ where: { resetpwdtoken: args.token } })
        if (!user) {
          throw new ApolloError('Le token fourni ne correspond à aucun utilisateur.')
        }
        const now = new Date()
        if (now > user.validtoken) {
          throw new ApolloError('Le token utilisé n\'est plus valide.')
        }
        args.password = await hash(args.password)
        await db.User.update({ password: args.password }, { where: { id: user.id } })
        const mailOptions = {
          to: user.email,
          subject: 'ScoreAthl mot de passe modifié',
          text: `Votre mote de passe a bien été modifié. Vous pouvez dorénavant vous connecter avec ce nouveau mot de passe.`,
          html: `Votre mot de passe a bien été réinitialisé.<br>
            <br>Vous pouvez dorénavant vous connecter avec ce nouveau mot de passe. <br>
            <br>Merci et à bientôt sur ScoreAthl<br>
            <br>Christope.`,
        }
        await googleService.transporter.sendMail(mailOptions)
      } catch (err) {
        throw err
      }
    }
  },
  Subscription: {
    nouveauUser: {
      subscribe: () => pubsub.asyncIterator(EVENTS.USER.NOUVEAU)
    },
    modificationUser: {
      subscribe:() => pubsub.asyncIterator(EVENTS.USER.MODIFICATION)
    }
  }
}
