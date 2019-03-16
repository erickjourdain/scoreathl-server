import { AuthenticationError, ApolloError } from 'apollo-server'
import { object, string, boolean, date, array, mixed } from 'yup'
import { forOwn, map } from 'lodash'

import { rolesOrAdmin, authorisedOrAdmin } from '../services/response'
import storeFS from '../services/store/storeFS'

export default {
  Query: {
    competition: (parent, { id }, { models }) => {
      return models.Competition.findById(id)
    },
    competitions: (parent, args, { models }) => {
      return models.Competition.find({})
    }
  },
  Mutation: {
    creerCompetition: async (parent, args, { models, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const schema = object().shape({
        nom: string().required().min(5, `Le nom de la compétition doit comporter au moins 5 caractères.`),
        emplacement: string().required().min(5, `L'emplacement de la compétition doit comporter au moins 5 caractères.`),
        date: date().required().min(new Date(), `La date de la compétition doit être postérieure à aujourd'hui.`),
        image: mixed(),
        statut: boolean(),
        pwd: string().required().min(5, 'Le mot de passe doit comporter au moins 5 caractères.'),
        organisateurs: array().of(string().required()).required()
      })
      await schema.validate(args)
      for (let i = 0; i < args.organisateurs.length; i++) {
        const organisateur = await models.User.findById(args.organisateurs[i])
        if (!rolesOrAdmin(organisateur, ['organisateur'])) {
          throw new ApolloError(`"${args.organisateurs[i]}" ne dispose pas des droits suffisant pour être organisateur.`)
        }
      }
      if (args.image) {
        const { createReadStream, filename, mimetype } = await args.image
        const stream = createReadStream()
        const { imagename } = await storeFS({ stream, filename })
        args.image = imagename
      }
      return models.Competition.create(args)
    },
    majCompetition: async (parent, args, { models, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const schema = object().shape({
        id: string().required(),
        nom: string().min(5, `Le nom de la compétition doit comporter au moins 5 caractères.`),
        emplacement: string().min(5, `L'emplacement de la compétition doit comporter au moins 5 caractères.`),
        date: date().min(new Date(), `La date de la compétition doit être postérieure à aujourd'hui.`),
        image: mixed(),
        statut: boolean(),
        pwd: string().min(5, 'Le mot de passe doit comporter au moins 5 caractères.'),
        organisateurs: array().of(string().required())
      })
      await schema.validate(args)
      const competition = await models.Competition.findById(args.id)
      if (!competition) {
        throw new ApolloError(`La compétition n'existe pas.`)
      }
      if (!authorisedOrAdmin(user, 'organisateurs')(competition)) {
        throw new ApolloError(`Vous n'êtes pas un des organisateurs de cette compétition.`)
      }
      if (args.organisateurs) {
        for (let i = 0; i < args.organisateurs.length; i++) {
          const organisateur = await models.User.findById(args.organisateurs[i])
          if (!rolesOrAdmin(organisateur, ['organisateur'])) {
            throw new ApolloError(`L'organisateur ${args.organisateurs[i]} ne dispose pas des droits suffisant.`)
          }
        }
      }
      if (args.image) {
        const { createReadStream, filename, mimetype } = await args.image
        const stream = createReadStream()
        const { imagename } = await storeFS({ stream, filename })
        args.image = imagename
      }
      forOwn(args, (value, key) => {
        competition[key] = value
      })
      return competition.save()
    }
  },
  Competition: {
    juges: (competition, args, { models }) => {
      return models.Juge.find({ competition: competition._id })
    },
    organisateurs: (competition, args, { models }) => {
      return map(competition.organisateurs, organisateur => {
        return models.User.findById(organisateur)
      })
    },
    equipes: (competition, args, { models }) => {
      return models.Equipe.find({ competition: competition._id })
    }
  }
}
