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
        const athlete = await db.Athlete.findByPk(args.athlete)
        const notation = await db.Notation.findOne({ 
          where: { EpreuveId: epreuve.id },
          include: [{
            model: db.Categorie,
            as: 'categories',
            where: { id: (await athlete.getCategorie()).id }
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
    },
    athleteCategorie: async (parent, args, { user, sequelize, db }) => {
      if (!user) {
        throw new AuthenticationError(`Vous devez être logué pour modifier une catégorie.`)
      }
      let transaction
      try {
        transaction = await sequelize.transaction()
        const schema = object().shape({
          athlete: string().required(),
          annee: number().integer().positive().min(1900).max(2020).required(),
          genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
        })
        await schema.validate(args)
        // vérification existance des données
        const athlete = await db.Athlete.findOne({
          where: { id: args.athlete },
          include: [{
            model: db.Categorie
          }]
        })
        if (!athlete) {
          throw new ApolloError(`L'athèle ${args.athlete} n'existe pas.`)
        }
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
          throw new ApolloError(`L'équipe de l'athèle ${args.athlete} n'existe pas.`)
        }
        if (!equipe.Competition) {
          throw new ApolloError(`La compétition associée à l'athèle ${args.athlete} n'existe pas.`)
        }
        if (!equipe.Competition.statut) {
          throw new ApolloError(`La compétition associée à l'athèle ${args.athlete} n'est pas ouverte.`)
        }
        // vérification si l'utilisateur possède les droits pour modifier la catégorie
        if (user.role !== 'admin') {
          if (!find(equipe.Competition.organisateurs, o => {
            return o.dataValues.id === user.id
          })) {
            throw new ApolloError(`Vous ne disposez pas des droits pour effectuer cette opération.`)
          }
        }
        // Rechercher la nouvelle catégorie
        const categorie = await getCategorie(db, args)
        if (categorie.id === athlete.Categorie.id) {
          throw new ApolloError(`La nouvelle catégorie est la même que la précédente.`)
        }
        athlete.CategorieId = categorie.id
        const scores = await athlete.getScores()
        for (let score in scores) {
          if (scores[score]) {
            const epreuve = await (db.Challenge.findByPk(scores[score].ChallengeId))
            if (!epreuve) {
              throw new ApolloError(`Aucune épreuve pour le challenge ${scores[score].ChallengeId}.`)
            }
            const notation = await db.Notation.findOne({ 
              where: { EpreuveId: epreuve.EpreuveId },
              include: [{
                model: db.Categorie,
                as: 'categories',
                where: { id: categorie.id }
              }, {
                model: db.Epreuve
              }]
            })
            if (!notation) {
              throw new ApolloError(`Aucune notation pour l'épreuve ${epreuve.id}.`)
            }
            const res = max(scores[score].marques)
            if (res <= 0) {
              scores[score].points = 0
            } else {
              scores[score].points = (notation.Epreuve.unitePrincipale === 'm')
                ? sortedIndex(orderBy(notation.points, [], 'asc'), res) + 1
                : 40 - sortedIndex(orderBy(notation.points, [], 'asc'), res)
            }
            await scores[score].save()
          }
        }
        athlete.annee = args.annee
        athlete.genre = args.genre
        await athlete.save()
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

const getCategorie = async (db, args) => {
  try {
    const categories = await db.Categorie.findAll({ where: { genre: args.genre }, order: [['anneeDebut', 'DESC']] })
    for (let categorie of categories) {
      if (args.annee >= categorie.anneeDebut && args.annee <= categorie.anneeFin) {
        return categorie
      } else if (args.annee >= categorie.anneeFin) {
        return categorie
      }
    }
    throw new ApolloError(`Aucune catégorie pour l'annéee ${args.annee} et le genre ${args.genre}`)
  } catch (err) {
    throw err
  }
}
