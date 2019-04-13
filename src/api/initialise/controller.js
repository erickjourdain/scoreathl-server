import { string, object } from 'yup'
import { fill } from 'lodash'

import hash from '../../services/hash'
import db from '../../models'
import epreuves from './data/epreuves'
import categories from './data/categories'
import notations from './data/notations'

export const initialise = async (req, res, next) => {
  try {
    await db.Epreuve.bulkCreate(epreuves)
    await db.Categorie.bulkCreate(categories)
    for (const notation of notations) {
      const epreuve = await db.Epreuve.findOne({ where: { nom: notation.epreuve } })
      if (!epreuve) {
        return res.status(404).json({
          valid: false,
          param: 'epreuve',
          message: `epreuve "${cotation.test}" non trouvée`
        })
      }
      let categories = []
      for (const cat of notation.categories) {
        const categorie = await db.Categorie.findOne({ where: { nom: cat, genre: notation.genre } })
        if (!categorie) {
          return res.status(404).json({
            valid: false,
            param: 'categorie',
            message: `categorie "${cat}" non trouvée`
          })
        }
        categories.push(categorie)
      }
      const newNotation = db.Notation.build({
        points: notation.points
      })
      await newNotation.save()
      await newNotation.setEpreuve(epreuve)
      await newNotation.addCategories(categories)
    }
    next()
  } catch (error) {
    console.log(error)
    res.status(500).end()
  }
}

export const createUser = async ({ body }, res, next) => {
  try {
    // vérification fourniture et validité de la clef
    var schema = object().shape({
      nom: string().required().min(3),
      password: string().required(),
      email: string().required().email(),
    })
    await schema.isValid(body)
    body.password = await hash(body.password)
    body.role = 'admin'
    await db.User.create(body)
    next()
  } catch (error) {
    console.log(error)
    res.status(500).end()
  }
}

export const createDatabase = async (req, res, next) => {
  try {
    await db.sequelize.sync({ force: true })
    next()
  } catch (err) {
    console.log(err)
    res.status(500).end()
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const seed = async (req, res, next) => {
  try {
    let date = new Date()
    date.setDate(date.getDate() + 5)
    const admin = await db.User.findOne({ where: { nom: 'ricoud' } })
    const epreuves = await db.Epreuve.findAll()
    const competition = await db.Competition.create({
      nom: 'les dieux du stade',
      emplacement: 'rosny-sous-bois',
      date: date,
      pwd: '123456',
      statut: true
    })
    await competition.setOrganisateurs([admin])
    for (let epreuve of epreuves) {
      const challenge = await db.Challenge.create({
        essais: epreuve.maxEssais,
        statut: true
      })
      await challenge.setCompetition(competition)
      await challenge.setEpreuve(epreuve)
    }
    const equipe = await db.Equipe.create({
      nom: 'les bolos',
      nomUnique: 'les bolos',
      statut: true
    })
    await equipe.setCompetition(competition)
    await equipe.setProprietaire(admin)

    let challenges = await competition.getChallenges()
    
    const adulte = await db.Athlete.create({
      nom: 'jourdain',
      prenom: 'erick',
      annee: 1969,
      genre: 'M'
    })
    await equipe.setAdulte(adulte)
    await defineCategorie(adulte, { genre: 'M', annee: 1969 })
    await defineScore(adulte, challenges)

    const enfant = await db.Athlete.create({
      nom: 'jourdain',
      prenom: 'christophe',
      annee: 2009,
      genre: 'M'
    })
    await equipe.setEnfant(enfant)
    await defineCategorie(enfant, { genre: 'M', annee: 2009 })
    await defineScore(enfant, challenges)

    next()
  } catch (err) {
    console.log(err)
    res.status(500).end()
  }
}

const defineScore = async (athlete, challenges) => {
  try {
    for (let i = 0; i < challenges.length; i++) {
      let score = await db.Score.create({
        points: 0,
        marques: fill(Array(challenges[i].dataValues.essais), 0)
      })
      await score.setChallenge(challenges[i])
      await score.setAthlete(athlete)
    }
    return true
  } catch (err) {
    throw err
  }
}

const defineCategorie = async (athlete, args) => {
  try {
    const categories = await db.Categorie.findAll({ where: { genre: args.genre }, order: [['anneeDebut', 'DESC']] })
    for (let categorie of categories) {
      if (args.annee >= categorie.anneeDebut && args.annee <= categorie.anneeFin) {
        await athlete.setCategorie(categorie)
        return true
      } else if (args.annee >= categorie.anneeFin) {
        await athlete.setCategorie(categorie)
        return true
      }
    }
    throw new ApolloError(`Aucune catégorie trouvée pour ${args.prenom} ${args.nom}`)
  } catch (err) {
    throw err
  }
}
