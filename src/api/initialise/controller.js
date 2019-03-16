import { string, object } from 'yup'

import { success } from '../../services/response'

import Models from '../../models'
import epreuves from './data/epreuves'
import categories from './data/categories'
import notations from './data/notations'

export const initialise = async (req, res) => {
  try {
    const existingEpreuves = await Models.Epreuve.find()
    if (existingEpreuves.length !== epreuves.length) {
      await Models.Epreuve.remove({})
      await Models.Epreuve.create(epreuves)
    }
    const existingCategories = await Models.Categorie.find()
    if (existingCategories.length !== categories.length) {
      await Models.Categorie.remove({})
      await Models.Categorie.create(categories)
    }
    const existingNotations = await Models.Notation.find()
    if (existingNotations.length !== notations.length) {
      await Models.Notation.remove({})
      for (const notation of notations) {
        const newNotation = {}
        newNotation.points = notation.points
        const epreuve = await Models.Epreuve.findOne({ nom: notation.epreuve })
        if (!epreuve) {
          return res.status(404).json({
            valid: false,
            param: 'epreuve',
            message: `epreuve "${cotation.test}" non trouvée`
          })
        }
        newNotation.epreuveId = epreuve
        newNotation.categoriesId = []
        for (const cat of notation.categories) {
          const categorie = await Models.Categorie.findOne({ nom: cat, genre: notation.genre })
          if (!categorie) {
            return res.status(404).json({
              valid: false,
              param: 'categorie',
              message: `categorie "${cat}" non trouvée`
            })
          }
          newNotation.categoriesId.push(categorie)
        }
        await Models.Notation.create(newNotation)
      }
    }
    success(res, 201)({ app_init: true })
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
    await Models.User.create(body)
    next()
  } catch (error) {
    console.log(error)
    res.status(500).end()
  }
}
