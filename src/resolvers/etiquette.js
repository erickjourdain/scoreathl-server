import { object, string} from 'yup'
import { ApolloError, AuthenticationError } from 'apollo-server'

import { rolesOrAdmin } from '../services/response'

export default {
  Query: {
    etiquette: (parent, { id }, { db }) => {
      return db.Etiquette.findByPk(id)
    },
    etiquettes: async (parent, args, { db }) => {
      return db.Etiquette.findAll()
    }
  },
  Mutation: {
    creerEtiquette: async (parent, args, { db, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const schema = object().shape({
        valeur: string().required().min(3, `Le nom de la compétition doit comporter au moins 3 caractères.`)
      })
      await schema.validate(args)
      return db.Etiquette.create(args)
    },
    supprimerEtiquette: async (parent, args, { db, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      const schema = object().shape({
        id: string().required()
      })
      await schema.validate(args)
      const equipe = await db.Equipe.findOne({ etiquette: args.id })
      if (equipe && equipe.length) {
        throw new ApolloError(`L'étiquette est utilisée, elle ne peut être supprimée.`)
      }
      await db.Etiquette.destroy({ where: { id: args.id } })
      return true
    }
  },
  Etiquette: {
    utilisee: async (etiquette, args, { db }) => {
      const equipe = await db.Equipe.findOne({ etiquette: etiquette.id })
      return (equipe) ? true : false
    }
  }
}
