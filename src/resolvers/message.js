import { object, string } from 'yup'
import { ApolloError } from 'apollo-server'

import pubsub, { EVENTS } from '../subscription'

export default {
  /*
  Query: {
    message: (parent, { id }, { db }) => {
      return db.Message.findByPk(id)
    },
    messages: (parent, args, { db }) => {
      return db.Message.findAll()
    }
  },
  */
  Mutation: {
    createMessage: async (parent, args, { db, user }) => {
      if (!user) {
        throw new AuthenticationError(`Vous devez être logué pour enregistrer une équipe.`)
      }
      // let transaction
      try {  
      //  transaction = await sequelize.transaction()
        const schema = object().shape({
          type: string().required(),
          data: object().shape({
            emoji: string(),
            text: string()
          }).required()
        })
        await schema.validate(args)
      /*
        const message = await db.Message.create({ 
          type: args.type,
          emoji: args.data.emoji || null,
          text: args.data.text || null 
        }, { transaction })
        await message.setUser(user, { transaction })
        await transaction.commit()
        const nouveauMessage = await db.Message.findOne({ 
          where: { id: message.id },
          include: [
            { model: db.User }
          ]
        })
      */
        const messageUser = await db.User.findByPk(user.id)
        const nouveauMessage = {
          type: args.type,
          emoji: args.data.emoji,
          text: args.data.text,
          createdAt: new Date(),
          user: messageUser.view()
        }
        pubsub.publish(EVENTS.MESSAGE.NOUVEAU, { nouveauMessage })
        return true
      } catch (err) {
        if (err) await transaction.rollback()
        throw err
      }
    } /*,
    deleteMessage: async (parent, args, { db, user }) => {
      try {
        const schema = object().shape({
          id: string().required()
        })
        await schema.validate(args)
        const message = db.Message.findByPk(args.id)
        if (!message) throw new ApolloError('Aucun message correspondant au critère')
        if (message.userId !== user.id || user.role !== 'admin') {
          throw new ApolloError('Vous ne disposez pas des droits nécessaires pour effacer ce message')
        }
        await db.Message.destroy({ where: { id: args.id } })
        pubsub.publish(EVENTS.MESSAGE.SUPPRIME, { suppressionMessage: args.id })
        return true
      } catch (err) {
        throw err
      }
    }
    */
  },
/*
  Message: {
    user: async (message) => {
      const user = await message.getUser()
      return user.view()
    }
  },
*/
  Subscription: {
    nouveauMessage: {
      subscribe: () => pubsub.asyncIterator(EVENTS.MESSAGE.NOUVEAU)
    }
    /*,
    suppressionMessage: {
      subscribe: () => pubsub.asyncIterator(EVENTS.MESSAGE.SUPPRIME)
    }
    */
  }
}
