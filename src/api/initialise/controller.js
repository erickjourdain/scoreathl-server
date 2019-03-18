import { string, object } from 'yup'

import db from '../../models'
import epreuves from './data/epreuves'
import categories from './data/categories'
import notations from './data/notations'

export const initialise = async (req, res, next) => {
  try {
    const existingEpreuves = await db.Epreuve.findAll()
    if (existingEpreuves.length !== epreuves.length) {
      await db.Epreuve.destroy({ where: {}, truncate: true })
      await db.Epreuve.bulkCreate(epreuves)
    }
    const existingCategories = await db.Categorie.findAll()
    if (existingCategories.length !== categories.length) {
      await db.Categorie.destroy({ where: {}, truncate: true })
      await db.Categorie.bulkCreate(categories)
    }
    const existingNotations = await db.Notation.findAll()
    if (existingNotations.length !== notations.length) {
      await db.Notation.destroy({ where: {}, truncate: true })
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
    console.log(error)
    res.status(500).end()
  }
}
