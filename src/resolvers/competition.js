import { AuthenticationError, ApolloError } from 'apollo-server'
import { object, string, boolean, date, array, mixed, number } from 'yup'
import { forOwn, fill } from 'lodash'

import { rolesOrAdmin, authorisedOrAdmin } from '../services/response'
import storeFS from '../services/store/storeFS'

export default {
  Query: {
    competition: (parent, { id }, { db }) => {
      return db.Competition.findByPk(id)
    },
    competitions: (parent, args, { db }) => {
      return db.Competition.findAll()
    }
  },
  Mutation: {
    creerCompetition: async (parent, args, { db, sequelize, user }) => {
      if (!rolesOrAdmin(user, ['organisateur'])) {
        throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
      }
      let transaction
      try {
        transaction = await sequelize.transaction()
        const schema = object().shape({
          nom: string().required().min(5, `Le nom de la compétition doit comporter au moins 5 caractères.`),
          emplacement: string().required().min(5, `L'emplacement de la compétition doit comporter au moins 5 caractères.`),
          date: date().required().min(new Date(), `La date de la compétition doit être postérieure à aujourd'hui.`),
          image: mixed(),
          statut: boolean(),
          pwd: string().required().min(5, 'Le mot de passe doit comporter au moins 5 caractères.'),
          organisateurs: array().of(string().required()).required(),
          challenges: array().of(object().shape({
            epreuve: string().required(),
            essais: number().integer().positive().required(),
            statut: boolean().required()
          }).required()).required()
        })
        await schema.validate(args)
        const organisateurs = []
        for (let i = 0; i < args.organisateurs.length; i++) {
          const organisateur = await db.User.findByPk(args.organisateurs[i])
          if (!rolesOrAdmin(organisateur, ['organisateur'])) {
            throw new ApolloError(`"${args.organisateurs[i]}" ne dispose pas des droits suffisant pour être organisateur.`)
          } else {
            organisateurs.push(organisateur)
          }
        }
        delete args.organisateurs
        const challenges = []
        for (let i = 0; i < args.challenges.length; i++) {
          const epreuve = await db.Epreuve.findByPk(args.challenges[i].epreuve)
          if (!epreuve) {
            throw new ApolloError(`"${args.challenges[i].epreuve}" n'est pas une épreuve valide.`)
          } else {
            const challenge = db.Challenge.build({ essais: args.challenges[i].essais, statut: args.challenges[i].statut })
            await challenge.save({ transaction })
            await challenge.setEpreuve(epreuve, { transaction })
            await challenges.push(challenge)
          }
        }
        delete args.challenges
        if (args.image) {
          const { createReadStream, filename, mimetype } = await args.image
          const stream = createReadStream()
          const { imagename } = await storeFS({ stream, filename })
          args.image = imagename
        }
        let competition = await db.Competition.create(args, { transaction })
        await competition.addOrganisateurs(organisateurs, { transaction })
        await competition.addChallenges(challenges, { transaction })
        await transaction.commit()
        return await db.Competition.findByPk(competition.id)
      } catch (err) {
        if (err) await transaction.rollback()
        throw err
      }
    },
    majCompetition: async (parent, args, { db, sequelize, user }) => {
      let transaction
      try {
        transaction = await sequelize.transaction()
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
          organisateurs: array().of(string().required()),
          challenges: array().of(object().shape({
            epreuve: string().required(),
            essais: number().integer().positive().required(),
            statut: boolean().required()
          }).required())
        })
        await schema.validate(args)
        const competition = await db.Competition.findByPk(args.id)
        if (!competition) {
          throw new ApolloError(`La compétition n'existe pas.`)
        }
        if (!authorisedOrAdmin(user, 'organisateurs')(competition)) {
          throw new ApolloError(`Vous n'êtes pas un des organisateurs de cette compétition.`)
        }
        if (args.organisateurs) {
          for (let i = 0; i < args.organisateurs.length; i++) {
            const organisateur = await db.User.findByPk(args.organisateurs[i])
            if (!rolesOrAdmin(organisateur, ['organisateur'])) {
              throw new ApolloError(`L'organisateur ${args.organisateurs[i]} ne dispose pas des droits suffisant.`)
            }
          }
        }
        if (args.challenges) {
          const athletes = await db.Equipe.findAll({ where: { CompetitionId: competition.id } })
          if (athletes.length) {
            const scores = await sequelize.query(`SELECT sc.*
              FROM Competitions AS cp
              INNER JOIN Equipes AS eq
              ON eq.CompetitionId = cp.id
              INNER JOIN Athletes AS at
              ON (at.id = eq.enfantId or at.id = eq.adulteId)
              INNER JOIN Scores AS sc
              ON sc.AthleteId = at.id
              WHERE cp.id = "${competition.id}"
              AND sc.statut != 0`, { type: sequelize.QueryTypes.SELECT})
            if (scores.length) {
              throw new ApolloError(`Impossible de mettre à jour les épreuves, des résultats sont déjà enregistrés pour celles-ci.`)
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
          if (key !== 'organisateurs' && key !== 'challenges')
          competition[key] = value
        })
        await competition.save({ transaction })
        if (args.organisateurs) {
          await competition.setOrganisateurs(args.organisateurs, { transaction })
        }
        if (args.challenges) {
          for (let i = 0; i < args.challenges.length; i++) {
            const challenge = await db.Challenge.findByPk(args.challenges[i].id)
            if (challenge && challenge.CompetitionId === competition.id) {
              challenge.essais = args.challenges[i].essais
              challenge.statut = args.challenges[i].statut
              await challenge.save({ transaction })
              const scores = await db.Score.findAll({ where: { ChallengeId: challenge.id } })
              for (let j = 0; j < scores.length; j++) {
                scores[j].marques = fill(Array(args.challenges[i].essais), 0)
                await scores[j].save({ transaction })
              }
            }
          }
        }
        await transaction.commit()
        return await db.Competition.findByPk(competition.id)
      } catch (err) {
        if (err) await transaction.rollback()
        throw err
      }
    },
    delCompetition: async (parent, args, { db, user }) => {
      try {
        if (!rolesOrAdmin(user, ['organisateur'])) {
          throw new AuthenticationError(`Vous ne disposez pas des droits nécessaires pour effectuer cette opération.`)
        }
        const schema = object().shape({
          id: string().required()
        })
        await schema.validate(args)
        const competition = await db.Competition.findByPk(args.id)
        if (!competition) {
          throw new ApolloError(`La compétition n'existe pas.`)
        }
        const equipes = competition.getEquipes()
        if (!equipes) {
          throw new ApolloError(`Impossible d'effacer une compétition avec des équipes inscrites.`)
        }
        await competition.destroy()
        return true
      } catch (err) {
        throw err
      }
    }
  },
  Competition: {
    organisateurs: (competition) => {
      return competition.getOrganisateurs()
    },
    equipes: (competition) => {
      return competition.getEquipes()
    },
    challenges: (competition) => {
      return competition.getChallenges()
    }
  }
}
