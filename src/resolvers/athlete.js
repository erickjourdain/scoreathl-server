import { ApolloError, AuthenticationError, withFilter } from 'apollo-server'
import { object, string, array, number } from 'yup'
import { find, findIndex, max, sortedIndex, orderBy } from 'lodash'
import { Op } from 'sequelize'
import pubsub, { EVENTS } from '../subscription'

import { authorisedOrAdmin } from '../services/response'

export default {
  Query: {
    athlete: (parent, { id }, { db }) => {
      return db.Athlete.findById(id)
    },
    athletes: (parent, args, { db }) => {
      return db.Athlete.findAll()
    } 
  },
  Mutation: {
    athleteResultat: async (parent, args, { user, sequelize, db }) => {
      if (!user) {
        throw new AuthenticationError(`Vous devez être logué pour ajouter un résultat.`)
      }
      let transaction
      try {
        transaction = await sequelize.transaction()
        const schema = object().shape({
          athlete: string().required(),
          resultat: object().shape({
            challenge: string().required(),
            resultats: array(number().required()).min(1).max(3).required()
          }).required()
        })
        await schema.validate(args)
        // vérification si score existe
        const score = await db.Score.findOne({ where: { AthleteId: args.athlete, ChallengeId: args.resultat.challenge } })
        if (!score) {
          throw new ApolloError(`Le score n'existe pas.`)
        }
        // vérification si équipe existe
        const equipe = await db.Equipe.findOne({ 
          where: { [Op.or]: [
            { adulteId: args.athlete },
            { enfantId: args.athlete }
          ]},
          include: [{
            model: db.Competition,
            include: [{
              model: db.User,
              as: 'organisateurs'
            }]
          }]
        })
        if (!equipe) {
          throw new ApolloError(`L'équipe n'existe pas.`)
        }
        // vérification si équipe validée
        if (!equipe.statut) {
          throw new ApolloError(`L'équipe n'est pas validée.`)
        }
        // vérification statut compétition
        if (!equipe.Competition) {
          throw new ApolloError(`La compétition n'existe pas.`)
        }
        if (!equipe.Competition.statut) {
          throw new ApolloError(`La compétition n'est pas ouverte.`)
        }
        // vérification si l'utilisateur possède les droits pour modifier le score
        if (user.role !== 'admin') {
          if (!find(equipe.Competition.organisateurs, o => {
            return o.dataValues.id === user.id
          })) {
            const juge = await db.Juge.findOne({where: { UserId: user.id, ChallengeId: args.resultat.epreuve } })
            if (!juge) {
              throw new ApolloError(`Vous ne disposez pas des droits pour effectuer cette opération.`)
            }
          }
        }
        // vérification si nombre de résultats correspond aux attentes
        const challenge = await db.Challenge.findByPk(args.resultat.challenge)
        const epreuve = await challenge.getEpreuve()
        if (!challenge) {
          throw new ApolloError(`L'épreuve ${args.resultat.challenge} n'existe pas.`)
        }
        if (challenge.essais !== args.resultat.resultats.length) {
          throw new ApolloError(`L'épreuve ${epreuve.nom} requiert ${challenge.essais} marques.`)
        }
        // enregistrement des marques
        const athele = await db.Athlete.findByPk(args.athlete)
        const notation = await db.Notation.findOne({ 
          where: { EpreuveId: epreuve.id },
          include: [{
            model: db.Categorie,
            as: 'categories',
            where: { id: (await athele.getCategorie()).id }
          }]
        })
        score.marques = args.resultat.resultats
        const res = max(args.resultat.resultats)
        if (res <= 0) {
          score.points = 0
        } else {
          score.points = (epreuve.unitePrincipale === 'm')
            ? sortedIndex(orderBy(notation.points, [], 'asc'), res) + 1
            : 40 - sortedIndex(orderBy(notation.points, [], 'asc'), res)
        }
        let nbRes = 0
        for (let i = 0; i < args.resultat.resultats.length; i++) {
          nbRes = (args.resultat.resultats[i] !== 0) ? nbRes + 1 : nbRes
        }
        if (nbRes === challenge.essais) {
          score.statut = 2
        } else if (nbRes) {
          score.statut = 1
        } else {
          score.statut = 0
        }
        await score.save()
        await transaction.commit()
        const modificationAthlete = {
          competition: equipe.Competition.id,
          equipe: equipe.id
        }
        pubsub.publish(EVENTS.ATHLETE.MODIFICATION, { modificationAthlete })
        return await db.Athlete.findByPk(args.athlete)
      } catch (err) {
        if (err) await transaction.rollback()
        throw err
      }
    }
  },
  Athlete: {
    scores: (athlete) => {
      return athlete.getScores()
    },
    categorie: (athlete) => {
      return athlete.getCategorie()
    },
    points: async (athlete) => {
      const scores = await athlete.getScores()
      let points = 0
      for (let i = 0; i < scores.length; i++) {
        points += scores[i].points
      }
      return points
    }
  },
  Subscription: {
    modificationAthlete: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.ATHLETE.MODIFICATION),
        async (payload, variables) => {
          return payload.modificationAthlete.competition === variables.competition
        }
      )
    }
  }
}
