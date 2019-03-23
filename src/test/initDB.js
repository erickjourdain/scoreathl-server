import sequelize from '../services/sequelize'
import db from '../models'

import epreuves from '../api/initialise/data/epreuves'
import categories from '../api/initialise/data/categories'
import notations from '../api/initialise/data/notations'

const initDb = async () => {
  await sequelize.sync({ force: true })
  await db.User.create({
    nom: 'ricoud',
    email: 'erickjourdain@free.fr',
    password: '123456',
    role: 'admin'
  })
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
}

export { initDb }