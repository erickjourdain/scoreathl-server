import { ApolloError } from 'apollo-server'
import { object, string, boolean, date, mixed } from 'yup'
import { forEach, forOwn, map } from 'lodash'

import { authorisedOrAdmin, rolesOrAdmin } from '../services/response'
import storeFS from '../services/store/storeFS'

export default {
  Query: {
    equipe: (parent, { id }, { models }) => {
      return models.Equipe.findById(id)
    },
    competitionEquipes: (parent, { id, statut }, { models }) => {
      const args = { competition: id }
      if (typeof(statut) === 'boolean') {
        args.statut = statut
      }
      return models.Equipe.find(args)
    }
  },
  Mutation: {
    creerEquipe: async (parent, args, { models, user}) => {
      if (!user) {
        throw new ApolloError(`Vous devez être logué pour enregistrer une équipe.`)
      }
      const schema = object().shape({
        nom: string().required().min(5, `Le nom de l'équipe doit comporter au moins 5 caractères.`),
        adulte: object().shape({
          nom: string().required().min(3, `Le nom doit comporter au moins 3 caractères.`),
          prenom: string().required().min(3, `Le prénom doit comporter au moins 3 caractères.`),
          dateNaissance: date().required(),
          genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
          avatar: mixed()
        }).required(),
        enfant: object().shape({
          nom: string().required().min(3, `Le nom doit comporter au moins 3 caractères.`),
          prenom: string().required().min(3, `Le prénom doit comporter au moins 3 caractères.`),
          dateNaissance: date().required(),
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
      const competition = await models.Competition.findById(args.competition)
      if (!competition) {
        throw new ApolloError(`La compétition n'existe pas.`)
      }
      const organisateur = authorisedOrAdmin(user, 'organisateurs')(competition)
      const role = rolesOrAdmin(user, ['organisateur'])
      if (!args.pwd) {
        if (!organisateur) {
          throw new ApolloError(`Vous devez fournir le mot de passe de la compétition pour enregistrer une équipe.`)
        }
      } else {
        if (!competition.authenticate(args.pwd)) {
          throw new ApolloError(`Le mot de passe fourni est incorrect.`)
        }
        if (!role && args.etiquette) {
          throw new ApolloError(`Vous ne disposez pas des droits pour ajouter une étiquette à une équipe.`)
        }
        if (!role && args.statut) {
          throw new ApolloError(`Vous ne disposez pas des droits pour définir le statut d'une équipe.`)
        }
        const equipe = await models.Equipe.findOne({ competition: args.competition, nom: args.nom.toLowerCase() })
        if (equipe) {
          throw new ApolloError(`Il existe déjà une équipe avec ce nom.`)
        }
        delete args.pwd
      }
      if (args.avatar) {
        const { createReadStream, filename, mimetype } = await args.avatar
        const stream = createReadStream()
        const { imagename } = await storeFS({ stream, filename })
        args.avatar = imagename
      }
      if (args.adulte.avatar) {
        const { createReadStream, filename, mimetype } = await args.adulte.avatar
        const stream = createReadStream()
        const { imagename } = await storeFS({ stream, filename })
        args.adulte.avatar = imagename
      }
      if (args.enfant.avatar) {
        const { createReadStream, filename, mimetype } = await args.enfant.avatar
        const stream = createReadStream()
        const { imagename } = await storeFS({ stream, filename })
        args.enfant.avatar = imagename
      }
      args.adulte.score = (await createScore(models))._id
      args.adulte.categorie = (await setCategorie(models, args.adulte))._id
      args.adulte = (await models.Athlete.create(args.adulte))._id
      args.enfant.score = (await createScore(models))._id
      args.enfant.categorie = (await setCategorie(models, args.enfant))._id
      args.enfant = (await models.Athlete.create(args.enfant))._id
      args.user = user._id
      return models.Equipe.create(args)
    },
    majEquipe: async (parent, args, { models, user}) => {
      if (!user) {
        throw new ApolloError(`Vous devez être logué pour mettre à jour une équipe.`)
      }
      const schema = object().shape({
        id: string().required(),
        nom: string().min(5, `Le nom de l'équipe doit comporter au moins 5 caractères.`),
        adulte: object().shape({
          nom: string().min(3, `Le nom doit comporter au moins 3 caractères.`),
          prenom: string().min(3, `Le prénom doit comporter au moins 3 caractères.`),
          dateNaissance: date(),
          genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
          avatar: string()
        }),
        enfant: object().shape({
          nom: string().min(3, `Le nom doit comporter au moins 3 caractères.`),
          prenom: string().min(3, `Le prénom doit comporter au moins 3 caractères.`),
          dateNaissance: date(),
          genre: string().oneOf(['M', 'F'], `Le genre n'est pas valide.`),
          avatar: string()
        }),
        avatar: string(),
        etiquette: string(),
        statut: boolean()
      })
      await schema.validate(args)
      const equipe = await models.Equipe.findById(args.id)
        .populate({ path: 'competition', populate: { path: 'organisateurs' } })
        .populate({ path: 'adulte', populate: { path: 'categorie' } })
        .populate({ path: 'enfant', populate: { path: 'categorie' } })
      if (!equipe) {
        throw new ApolloError(`L'équipe n'existe pas.`)
      }
      if (!equipe.competition.statut) {
        throw new ApolloError(`Impossible de mettre à jour une équipe d'une compétition fermée.`)
      }
      if ((args.enfant || args.adulte) && (args.enfant.dateNaissance || args.enfant.genre || args.adulte.dateNaissance || args.adulte.genre)
        && equipe.statut) {
        throw new ApolloError(`Impossible de mettre à jour la catégorie d'une équipe validée.`)
      }
      const organisateur = authorisedOrAdmin(user, 'organisateurs')(equipe.competition)
      const createur = user._id.equals( equipe.user)
      if (!organisateur && !createur) {
        throw new ApolloError(`Vous ne disposez des droits nécessaires pour effectuer cette opération.`)
      }
      if (!organisateur && args.etiquette) {
        throw new ApolloError(`Vous ne disposez pas des droits pour ajouter une étiquette à une équipe.`)
      }
      if (!organisateur && args.statut) {
        throw new ApolloError(`Vous ne disposez pas des droits pour définir le statut d'une équipe.`)
      }
      if (args.adulte && (args.adulte.dateNaissance || args.adulte.genre)) {
        if (!args.adulte.genre) {
          args.adulte.genre = equipe.adulte.categorie.genre
        }
        if (!args.adulte.dateNaissance) {
          args.adulte.dateNaissance = equipe.adulte.dateNaissance
        }
        args.adulte.categorie = (await setCategorie(models, args.adulte))._id
      }
      if (args.enfant && (args.enfant.dateNaissance || args.enfant.genre)) {
        if (!args.enfant.genre) {
          args.enfant.genre = equipe.enfant.categorie.genre
        }
        if (!args.enfant.dateNaissance) {
          args.enfant.dateNaissance = equipe.enfant.dateNaissance
        }
        args.enfant.categorie = (await setCategorie(models, args.enfant))._id
      }
      if (args.nom) {
        const existingEquipe = await models.Equipe.findOne({
          $and: [
            { competition: equipe.competition._id, nomUnique: args.nom.toLowerCase() },
            { _id: { $ne: equipe._id } }
          ]
        })
        if (existingEquipe) {
          throw new ApolloError(`Il existe déjà une équipe avec ce nom.`)
        }
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
      return equipe.save()
    },
    supprimerEquipe: async (parent, { id }, { models, user}) => {
      if (!user) {
        throw new ApolloError(`Vous devez être logué pour enregistrer une équipe.`)
      }
      const equipe = await models.Equipe.findById(id)
        .populate('competition')
        .populate({ path: 'adulte', populate: { path: 'score' } })
        .populate({ path: 'enfant', populate: { path: 'score' } })
      if (!equipe) {
        throw new ApolloError(`L'équipe n'existe pas.`)
      }
      if (!authorisedOrAdmin(user, 'organisateurs')(equipe.competition) && (!user._id.equals( equipe.user))) {
        throw new ApolloError(`Vous ne disposez des droits nécessaires pour effectuer cette opération.`)
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
      await models.Score.deleteOne({ _id: equipe.adulte.score })
      await models.Score.deleteOne({ _id: equipe.enfant.score })
      await models.Athlete.deleteOne({ _id: equipe.adulte._id })
      await models.Athlete.deleteOne({ _id: equipe.enfant._id })
      await models.Equipe.deleteOne({ _id: equipe._id })
      return true
    }
  },
  Equipe: {
    competition: (equipe, args, { models }) => {
      return models.Competition.findById(equipe.competition)
    },
    adulte: (equipe, args, { models }) => {
      return models.Athlete.findById(equipe.adulte)
    },
    enfant: (equipe, args, { models }) => {
      return models.Athlete.findById(equipe.enfant)
    },
    points: async (equipe, args, { models }) => {
      const adulte = await models.Athlete.findById(equipe.adulte)
      const enfant = await models.Athlete.findById(equipe.enfant)
      const pointsAdulte = (await models.Score.findById(adulte.score)).points
      const pointsEnfant = (await models.Score.findById(enfant.score)).points
      return pointsAdulte + pointsEnfant
    },
    etiquette: (equipe, args, { models }) => {
      return (equipe.etiquette) ? models.Etiquette.findById(equipe.etiquette) : null
    },
    proprietaire: (equipe, args, { models }) => {
      return models.User.findById(equipe.user)
    } 
  }
}

/**
 * création d'un nouveau document Score dans la base de données
 * 
 * @param {Object} models - objet représentant les modèles Mongoose de la base de données
 * @returns {Object} nouveau mongoose Score document
 */
 const createScore = async (models) => {
  const epreuves = await models.Epreuve.find()
  const score = {
    points: 0,
    resultats: []
  }
  forEach(epreuves, epreuve => {
    let resultat
    switch (epreuve.nom) {
      case '1 000m':
      case 'relais':
        resultat = [0]
        break
      default:
        resultat = [0, 0, 0]     
        break
    }
    score.resultats.push({
      epreuve: epreuve._id,
      resultat,
      score: 0
    })
  })
  return models.Score.create(score)
}

/**
 * récupération de la catégorie d'un athèle en fonction de sa date de naissance
 * 
 * @param {Object} models - objet représentant les modèles Mongoose de la base de données 
 * @param {Object} athlete - objet représentant un document de type Athlete
 * @returns {Object} le document Categorie correspondant à la date de naissance de l'athlète
 */
const setCategorie = async (models, athlete) => {
  const year = athlete.dateNaissance.getFullYear()
  const categories = await models.Categorie.find({ genre: athlete.genre }).sort('-anneeDebut')
  for (let categorie of categories) {
    if (year >= categorie.anneeDebut && year <= categorie.anneeFin) {
      return categorie
    } else if (year >= categorie.anneeFin) {
      return categorie
    }
  }
  return null
}
