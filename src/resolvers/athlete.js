import { ApolloError } from 'apollo-server'
import { object, string, array, number } from 'yup'
import { find, findIndex, max, sortedIndex, orderBy } from 'lodash'
import { Op } from 'sequelize/lib/operators'

import { authorisedOrAdmin } from '../services/response'

export default {
  Query: {
    athlete: (parent, { id }, { db }) => {
      return db.Athlete.findById(id)
    }
  },
  Mutation: {
    athleteResultat: async (parent, args, { user, db }) => {
      if (!user) {
        throw new ApolloError(`Vous devez être logué pour ajouter un résultat.`)
      }
      const schema = object().shape({
        athlete: string().required(),
        resultat: object().shape({
          epreuve: string().required(),
          resultats: array(number().required()).min(1).max(3).required()
        }).required()
      })
      await schema.validate(args)
      // vérification si athlète existe
      const athlete = await db.Athlete.findOne({ where: { id: args.athlete }, include: ['score'] })
      if (!athlete) {
        throw new ApolloError(`L'athlète n'existe pas.`)
      }
      // vérification si équipe existe
      const equipe = await db.Equipe.findOne({ 
        where: { [Op.or]: [
          { adulte: athlete.id },
          { enfant: athlete.id }
        ]},
        include: [
          {
            model: db.Competition,
            include: ['organisateurs']
          }
        ]
      })
      if (!equipe) {
        throw new ApolloError(`L'équipe n'existe pas.`)
      }
      // vérification si équipe validée
      if (!equipe.statut) {
        throw new ApolloError(`L'équipe n'est pas validée.`)
      }
      // vérification statut équipe
      if (!equipe.competition.statut) {
        throw new ApolloError(`La compétition n'est pas ouverte.`)
      }
      // vérification si épreuve existe
      const epreuve = await db.Epreuve.findByPk(args.resultat.epreuve)
      if (!epreuve) {
        throw new ApolloError(`L'épreuve ${args.resultat.epreuve} n'existe pas.`)
      }
      // vérification si l'utilisateur possède les droits pour modifier le score
      const juges = await db.Juge.find({ where: { competition: equipe.competition._id, user: user._id } })
      const organisateur = authorisedOrAdmin(user, 'organisateurs')(equipe.competition)
      if (!organisateur && !find(juges.epreuves, args.resultat.epreuve)) {
        throw new ApolloError(`Vous ne disposez pas des droits pour effectuer cette opération.`)
      }
      // vérification si nombre de résultats correspond aux attentes
      if (epreuve.unitePrincipale !== 'm' && args.resultat.resultats.length > 1) {
        throw new ApolloError(`L'épreuve ${epreuve.nom} n'autorise qu'un seul résultat.`)
      }
      // association objet épreuve aux arguments
      args.resultat.epreuve = epreuve     
      const index = findIndex(athlete.score.resultats, { epreuve: args.resultat.epreuve._id })
      athlete.score.resultats[index].resultat = args.resultat.resultats
      const notation = await db.Notation.findOne({
        where: { 
          [Op.and]: [
            { epreuveId: args.resultat.epreuve._id },
            { categoriesId: athlete.categorie }
          ]
        }
      })
      const res = max(args.resultat.resultats)
      if (res <= 0) {
        athlete.score.resultats[index].score = 0
      } else {
        athlete.score.resultats[index].score = (epreuve.unitePrincipale === 'm')
          ? sortedIndex(orderBy(notation.points, [], 'asc'), res) + 1
          : 40 - sortedIndex(orderBy(notation.points, [], 'asc'), res)
      }
      let nbRes = 0
      for (let i = 0; i < args.resultat.resultats.length; i++) {
        nbRes = (args.resultat.resultats[i] !== 0) ? nbRes + 1 : nbRes
      }
      if ((epreuve.unitePrincipale !== 'm' && nbRes === 1) ||  (epreuve.unitePrincipale === 'm' && nbRes === 3)) {
        athlete.score.resultats[index].statut = 2
      } else if (nbRes) {
        athlete.score.resultats[index].statut = 1
      } else {
        athlete.score.resultats[index].statut = 0
      }
      await athlete.score.save()
      return await db.Athlete.findById(args.athlete)
    }
  },
  Athlete: {
    score: (athlete, args, { db }) => {
      return db.Score.findByPk(athlete.score)
    },
    categorie: (athlete, args, { db }) => {
      return db.Categorie.findByPk(athlete.categorie)
    }
  }
}
