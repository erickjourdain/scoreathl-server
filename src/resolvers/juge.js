import { AuthenticationError, ApolloError } from 'apollo-server'
import { object, string, array } from 'yup'
import { map } from 'lodash'

import { rolesOrAdmin, authorisedOrAdmin } from '../services/response'
export default {
  Query: {
    jugesCompetition: async (parent, args, { models }) => {
      const schema = object().shape({
        competition: string().required()
      })
      await schema.validate(args)
      return models.Juge.find({ competition: args.competition })
    }
  },
  Mutation: {
    defineCompetitionJuges: async (parent, args, { models, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const schema = object().shape({
        competition: string().required(),
        juges: array().of(object().shape({
          user: string().required(),
          epreuves: array(string().required()).required()
        }))
      })
      await schema.validate(args)
      const competition = await models.Competition.findById(args.competition)
      if (!competition) {
        throw new ApolloError(`La compétition "${args.competition}" n'existe pas.`)
      }
      if (!authorisedOrAdmin(user, 'organisateurs')(competition)) {
        throw new ApolloError(`Vous n'êtes pas un des organisateurs de cette compétition.`)
      }
      await models.Juge.deleteMany({ competition: competition._id })
      for (let i = 0; i < args.juges.length; i++) {
        const juge = new models.Juge()
        juge.competition = competition._id
        juge.user = await models.User.findById(args.juges[i].user)
        if (!juge.user) {
          throw new ApolloError(`L'utilisateur "${args.juges[i].user}" n'existe pas dans la base de données.`)
        }
        if (!rolesOrAdmin(juge.user, ['organisateur', 'juge'])) {
          throw new ApolloError(`L'utilisateur "${args.juges[i]}" ne dispose pas des droits suffisants pour être juge.`)
        }
        for (let j = 0; j < args.juges[i].epreuves.length; j++) {
          const epreuve = await models.Epreuve.findById(args.juges[i].epreuves[j])
          if (!epreuve) {
            throw new ApolloError(`L'épreuve "${args.juges[i].epreuves[j]}" n'existe pas.`)
          }
          juge.epreuves.push(epreuve)
        }
        await juge.save()
      }
      return models.Competition.findById(competition._id)
    }
  },
  Juge: {
    user: (juge, args, { models }) => {
      return models.User.findById(juge.user)
    },
    epreuves: (juge, args, { models }) => {
      return map(juge.epreuves, epreuve => {
        return models.Epreuve.findById(epreuve)
      })
    }
  }
}
