import { AuthenticationError, ApolloError } from 'apollo-server'
import { object, string, array, number } from 'yup'

import pubsub, { EVENTS } from '../subscription'

export default {
  Query: {
    categorie: (parent, { id }, { db }) => {
      return db.Categorie.findByPk(id)
    },
    categories: async (parent, args, { db }) => {
      return db.Categorie.findAll({
        order: [ [ 'anneeDebut', 'asc' ]]
      })
    }
  },
  Mutation: {
    updateCategories: async (parent, args, { db, sequelize, user }) => {
      if (!user || user.role !== 'admin') {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      let transaction
      try {
        transaction = await sequelize.transaction()
        const schema = object().shape({
          categories: array().of(
            object().shape({
              id: array().of(string().required()).required(),
              anneeDebut: number().integer().positive().required(),
              anneeFin: number().integer().positive().required()
            }).required()
          ).required()
        }).required()
        await schema.validate(args)
        for (let i in args.categories) {
          if (args.categories[i].anneeDebut >= args.categories[i].anneeFin) {
            throw new ApolloError(`L'année de début doit être inférieure à l'année de fin.`)
          }
          for (let j in args.categories[i].id) {
            await db.Categorie.update({
              anneeDebut: args.categories[i].anneeDebut,
              anneeFin: args.categories[i].anneeFin
            }, {
              where: { id: args.categories[i].id[j] }
            })
          }
        }
        await transaction.commit()
        const modificationCategories = await db.Categorie.findAll({
          order: [ [ 'anneeDebut', 'asc' ]]
        })
        pubsub.publish(EVENTS.CATEGORIE.MODIFICATION, { modificationCategories })
        return true
      } catch (err) {
        if (err) await transaction.rollback()
        throw err
      }
    }
  },
  Categorie: {
    notations: (categorie, args, { db }) => {
      return categorie.getNotations() 
    }
  },
  Subscription: {
    modificationCategories: {
      subscribe: () => pubsub.asyncIterator(EVENTS.CATEGORIE.MODIFICATION)
    }
  }
}
