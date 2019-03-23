import { ApolloError, AuthenticationError } from 'apollo-server'
import { object, string, boolean, mixed, number } from 'yup'
import { forEach, forOwn, map, fill } from 'lodash'
import { Op } from 'sequelize'

import { authorisedOrAdmin, rolesOrAdmin } from '../services/response'
import storeFS from '../services/store/storeFS'

export default {
  Query: {
    equipe: (parent, { id }, { db }) => {
      return db.Equipe.findByPk(id)
    },
    competitionEquipes: (parent, { id, statut }, { db }) => {
      const args = { competition: id }
      if (typeof(statut) === 'boolean') {
        args.statut = statut
      }
      return db.Equipe.find(args)
    }
  },
  Mutation: {
    creerEquipe: async (parent, args, { db, sequelize, user}) => {
      if (!user) {
        throw new AuthenticationError(`Vous devez être logué pour enregistrer une équipe.`)
      }
      let transaction
      try {
        transaction = await sequelize.transaction()

        const schema = object().shape({
          nom: string().required().min(5, `Le nom de l'équipe doit comporter au moins 5 caractères.`),
          adulte: object().shape({
            nom: string().required().min(3, `Le nom doit comporter au moins 3 caractères.`),
            prenom: string().required().min(3, `Le prénom doit comporter au moins 3 caractères.`),
            annee: number().integer().positive().min(1950).max(2010).required(),
            genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
            avatar: mixed()
          }).required(),
          enfant: object().shape({
            nom: string().required().min(3, `Le nom doit comporter au moins 3 caractères.`),
            prenom: string().required().min(3, `Le prénom doit comporter au moins 3 caractères.`),
            annee: number().integer().positive().min(2000).max(2015).required(),
            genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
            avatar: mixed()
          }).required(),
          competition: string().required(),
          pwd: string().min(5, 'Le mot de passe doit comporter au moins 5 caractères.'),
          avatar: mixed(),
          etiquette: string(),
          statut: boolean()
        })
        await schema.validate(args)
        const competition = await db.Competition.findByPk(args.competition)
        if (!competition) {
          throw new ApolloError(`La compétition n'existe pas.`)
        }
        if (!competition.statut) {
          throw new ApolloError(`La compétition n'est pas ouverte.`)
        }
        const organisateur = authorisedOrAdmin(user, 'organisateurs')(competition)
        const role = rolesOrAdmin(user, ['organisateur'])
        if (!args.pwd) {
          if (!organisateur) {
            throw new ApolloError(`Vous devez fournir le mot de passe de la compétition pour enregistrer une équipe.`)
          }
        } else {
          if (!await competition.authenticate(args.pwd)) {
            throw new ApolloError(`Le mot de passe fourni est incorrect.`)
          }
          if (!role && args.etiquette) {
            throw new AuthenticationError(`Vous ne disposez pas des droits pour ajouter une étiquette à une équipe.`)
          }
          if (!role && args.statut) {
            throw new AuthenticationError(`Vous ne disposez pas des droits pour définir le statut d'une équipe.`)
          }
          const equipe = await db.Equipe.findOne({ where: { competition: args.competition, nom: args.nom.toLowerCase() } })
          if (equipe) {
            throw new ApolloError(`Il existe déjà une équipe avec ce nom dans la compétition.`)
          }
          delete args.pwd
        }
  
        const avatar = null
        if (args.avatar) {
          const { createReadStream, filename, mimetype } = await args.avatar
          const stream = createReadStream()
          const { imagename } = await storeFS({ stream, filename })
          avatar = imagename
        } 
  
        const equipe = await db.Equipe.create({
          nom: args.nom.trim(),
          nomUnique: args.nom.trim().toLowerCase(),
          statut: (args.statut) ? args.statut : false,
          avatar,
          etiquette: (args.etiquette) ? args.etiquette : null
        }, { transaction })
        await equipe.setCompetition(competition, { transaction })
        await equipe.setProprietaire(user, { transaction })
  
        let challenges = await competition.getChallenges()
        let avatarAdulte = null
        if (args.adulte.avatar) {
          const { createReadStream, filename, mimetype } = await args.adulte.avatar
          const stream = createReadStream()
          const { imagename } = await storeFS({ stream, filename })
          avatarAdulte = imagename
        }

        const adulte = await db.Athlete.create({
          nom: args.adulte.nom.trim(),
          prenom: args.adulte.prenom.trim(),
          annee: args.adulte.annee,
          avatar: avatarAdulte
        }, { transaction })
      
        await equipe.setAdulte(adulte, { transaction })
        await defineCategorie(db, transaction, adulte, args.adulte)
        await defineScore(db, transaction, adulte, challenges)        

        let avatarEnfant = null
        if (args.enfant.avatar) {
          const { createReadStream, filename, mimetype } = await args.enfant.avatar
          const stream = createReadStream()
          const { imagename } = await storeFS({ stream, filename })
          avatarEnfant = imagename
        }

        const enfant = await db.Athlete.create({
          nom: args.enfant.nom.trim(),
          prenom: args.enfant.prenom.trim(),
          annee: args.enfant.annee,
          avatar: avatarEnfant
        }, { transaction })
      
        await equipe.setEnfant(enfant, { transaction })
        await defineCategorie(db, transaction, enfant, args.enfant)
        await defineScore(db, transaction, enfant, challenges)

        await transaction.commit()
        return await db.Equipe.findByPk(equipe.id)
      } catch (error) {
        if (error) await transaction.rollback()
        throw error
      }
    },
    majEquipe: async (parent, args, { db, sequelize, user}) => {
      if (!user) {
        throw new AuthenticationError(`Vous devez être logué pour mettre à jour une équipe.`)
      }
      let transaction
      try {
        transaction = await sequelize.transaction()

        const schema = object().shape({
          id: string().required(),
          nom: string().min(5, `Le nom de l'équipe doit comporter au moins 5 caractères.`),
          adulte: object().shape({
            nom: string().min(3, `Le nom doit comporter au moins 3 caractères.`),
            prenom: string().min(3, `Le prénom doit comporter au moins 3 caractères.`),
            annee: number().integer().positive().min(1950).max(2010),
            genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
            avatar: string()
          }),
          enfant: object().shape({
            nom: string().min(3, `Le nom doit comporter au moins 3 caractères.`),
            prenom: string().min(3, `Le prénom doit comporter au moins 3 caractères.`),
            annee: number().integer().positive().min(2000).max(2015),
            genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
            avatar: string()
          }),
          avatar: string(),
          etiquette: string(),
          statut: boolean()
        })
        await schema.validate(args)
        const equipe = await db.Equipe.findOne({
          where: { id:  args.id},
          include: [
            {
              model: db.Competition,
              include: [ { model: db.User, as: 'organisateurs'} ]
            },
            {
              model: db.Athlete,
              as: 'adulte',
              include: [ { model: db.Categorie }]
            },
            {
              model: db.Athlete,
              as: 'adulte',
              include: [ { model: db.Categorie }]
            },
            {
              model: db.User,
              as: 'proprietaire'
            }
          ]
        })
        if (!equipe) {
          throw new ApolloError(`L'équipe n'existe pas.`)
        }
        if (!equipe.Competition.statut) {
          throw new ApolloError(`Impossible de mettre à jour une équipe d'une compétition fermée.`)
        }
        if ((args.adulte) && (args.adulte.annee || args.adulte.genre)
          && equipe.statut) {
          throw new ApolloError(`Impossible de mettre à jour la catégorie d'une équipe validée.`)
        }
        if ((args.enfant) && (args.enfant.annee || args.enfant.genre)
          && equipe.statut) {
          throw new ApolloError(`Impossible de mettre à jour la catégorie d'une équipe validée.`)
        }
        // vérification si l'utilisateur possède les droits pour modifier le score
        let organisateur = true
        if (user.role !== 'admin') {
          if (!find(equipe.Competition.organisateurs, o => {
            return o.dataValues.id === user.id
          })) {
            if (equipe.proprietaire.id !== user.id) {
              throw new ApolloError(`Vous ne disposez pas des droits pour effectuer cette opération.`)
            } else {
              organisateur = false
            }
          }
        }
        if (!organisateur && args.etiquette) {
          throw new AuthenticationError(`Vous ne disposez pas des droits pour ajouter une étiquette à une équipe.`)
        }
        if (!organisateur && args.statut) {
          throw new AuthenticationError(`Vous ne disposez pas des droits pour définir le statut d'une équipe.`)
        }

        if (args.adulte && (args.adulte.annee || args.adulte.genre)) {
          if (!args.adulte.genre) {
            args.adulte.genre = equipe.adulte.Categorie.genre
          }
          if (!args.adulte.annee) {
            args.adulte.annee = equipe.adulte.annee
          }
          await defineCategorie(db, transaction, adulte, args.adulte)
        }
        if (args.enfant && (args.enfant.annee || args.enfant.genre)) {
          if (!args.enfant.genre) {
            args.enfant.genre = equipe.enfant.Categorie.genre
          }
          if (!args.enfant.annee) {
            args.enfant.annee = equipe.enfant.annee
          }
          await defineCategorie(db, transaction, enfant, args.enfant)
        }
        if (args.nom) {
          const existingEquipe = await db.Equipe.findOne({
            where: { [Op.or]: [
              { CompetitionId: equipe.Competition.id, nomUnique: args.nom.toLowerCase() },
              { id: { [Op.ne]: equipe.id } }
            ]}
          })
          if (existingEquipe) {
            throw new ApolloError(`Il existe déjà une équipe avec ce nom.`)
          }
          args.nomUnique = args.nom.trim().toLowerCase()
        }
        if (args.avatar) {
          const { createReadStream, filename, mimetype } = await args.avatar
          const stream = createReadStream()
          const { imagename } = await storeFS({ stream, filename })
          args.avatar = imagename
        }
        if (args.adulte && args.adulte.avatar) {
          const { createReadStream, filename, mimetype } = await args.adulte.avatar
          const stream = createReadStream()
          const { imagename } = await storeFS({ stream, filename })
          args.adulte.avatar = imagename
        }
        if (args.enfant && args.enfant.avatar) {
          const { createReadStream, filename, mimetype } = await args.enfant.avatar
          const stream = createReadStream()
          const { imagename } = await storeFS({ stream, filename })
          args.enfant.avatar = imagename
        }
        forOwn(args, (value,key) => {
          if (key === 'adulte' || key === 'enfant') {
            forOwn(value, (val, key2) => {
              equipe[key][key2] = val
            })
          } else {
            equipe[key] = value
          }
        })
        if (args.adulte) {
          await equipe.adulte.save()
        }
        if (args.enfant) {
          await equipe.enfant.save()
        }
        await equipe.save()
        await transaction.commit()
        return db.Equipe.findByPk(equipe.id)
      } catch (err) {
        if (err) await transaction.rollback()
        throw err
      }
    },
    supprimerEquipe: async (parent, { id }, { db, user}) => {
      if (!user) {
        throw new AuthenticationError(`Vous devez être logué pour enregistrer une équipe.`)
      }
      const equipe = await db.Equipe.find({
        where: {
          id
        },
        include: [
          'competition'
        , {
          models: 'adulte',
          include: ['score']
        }, {
          models: 'enfant',
          include: ['score']
        }]
      })
      if (!equipe) {
        throw new ApolloError(`L'équipe n'existe pas.`)
      }
      if (!authorisedOrAdmin(user, 'organisateurs')(equipe.competition) && (user.id !== equipe.proprietaire)) {
        throw new AuthenticationError(`Vous ne disposez des droits nécessaires pour effectuer cette opération.`)
      }
      if (equipe.statut) {
        throw new ApolloError(`Impossible de supprimer une équipe validée.`)
      }
      let authorise = true
      map(equipe.enfant.score.resultats, res => {
        if (res.resultat.statut) {
          authorise = false
        }
      })
      map(equipe.adulte.score.resultats, res => {
        if (res.resultat.statut) {
          authorise = false
        }
      })
      if (!authorise) {
        throw new ApolloError(`Impossible de supprimer une équipe avec des résultats enregistrés.`)
      }
      /*
      await db.Score.deleteOne({ _id: equipe.adulte.score })
      await db.Score.deleteOne({ _id: equipe.enfant.score })
      await db.Athlete.deleteOne({ _id: equipe.adulte._id })
      await db.Athlete.deleteOne({ _id: equipe.enfant._id })
      */
      await db.Equipe.destroy({ id: equipe.id })
      return true
    }
  },
  Equipe: {
    competition: (equipe, args, { db }) => {
      return db.Competition.findByPk(equipe.competition)
    },
    adulte: (equipe) => {
      return equipe.getAdulte()
    },
    enfant: (equipe) => {
      return equipe.getEnfant()
    },
    points: async (equipe, args, { db }) => {
      const adulte = await db.Athlete.findByPk(equipe.adulte)
      const enfant = await db.Athlete.findByPk(equipe.enfant)
      const pointsAdulte = (await db.Score.findByPk(adulte.score)).points
      const pointsEnfant = (await db.Score.findByPk(enfant.score)).points
      return pointsAdulte + pointsEnfant
    },
    etiquette: (equipe) => {
      return equipe.getEtiquette()
    },
    proprietaire: (equipe) => {
      return equipe.getProprietaire()
    } 
  }
}

 const defineScore = async (db, transaction, athlete, challenges) => {
  try {
    for (let i = 0; i < challenges.length; i++) {
      let score = await db.Score.create({
        points: 0,
        marques: fill(Array(challenges[i].dataValues.essais), 0)
      }, { transaction })
      await score.setChallenge(challenges[i], { transaction })
      await score.setAthlete(athlete, { transaction })
    }
    return true
  } catch (err) {
    throw err
  }
}

const defineCategorie = async (db, transaction, athlete, args) => {
  try {
    const categories = await db.Categorie.findAll({ where: { genre: args.genre }, order: [['anneeDebut', 'DESC']] })
    for (let categorie of categories) {
      if (args.annee >= categorie.anneeDebut && args.annee <= categorie.anneeFin) {
        await athlete.setCategorie(categorie, { transaction })
        return true
      } else if (args.annee >= categorie.anneeFin) {
        await athlete.setCategorie(categorie, { transaction })
        return true
      }
    }
    throw new ApolloError(`Aucune catégorie trouvée pour ${args.prenom} ${args.nom}`)
  } catch (err) {
    throw err
  }
}
