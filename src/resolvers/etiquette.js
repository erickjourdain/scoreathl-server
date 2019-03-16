import { object, string} from 'yup'
import { ApolloError } from 'apollo-server'

import { rolesOrAdmin } from '../services/response'

export default {
  Query: {
    etiquette: (parent, { id }, { models }) => {
      return models.Etiquette.findById(id)
    },
    etiquettes: async (parent, args, { models }) => {
      return models.Etiquette.find({})
    }
  },
  Mutation: {
    creerEtiquette: async (parent, args, { models, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const schema = object().shape({
        valeur: string().required().min(3, `Le nom de la compétition doit comporter au moins 3 caractères.`)
      })
      await schema.validate(args)
      return models.Etiquette.create(args)
    },
    supprimerEtiquette: async (parent, args, { models, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const schema = object().shape({
        id: string().required()
      })
      await schema.validate(args)
      const equipe = await models.Equipe.findOne({ etiquette: args.id })
      if (equipe && equipe.length) {
        throw new ApolloError(`L'étiquette est utilisée, elle ne peut être supprimée.`)
      }
      await models.Etiquette.deleteOne({ _id: args.id })
      return true
    }
  },
  Etiquette: {
    utilisee: async (etiquette, args, { models }) => {
      const equipe = await models.Equipe.findOne({ etiquette: etiquette._id })
      return (equipe) ? true : false
    }
  }
}
