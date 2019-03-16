import mongoose from 'mongoose'

const ObjectId = mongoose.Types.ObjectId

export default {
  Query: {
    notation: (parent, { id }, { models }) => {
      return models.Notation.findById(id)
    },
    notations: (parent, args, { models }) => {
      return models.Notation.find({})
    }
  },

  Notation: {
    epreuve: (notation, args, { models }) => {
      return models.Epreuve.findById(notation.epreuveId)
    },
    categories: (notation, args, { models }) => {
      let objectIdArray = notation.categoriesId.map(s => ObjectId(s))
      return models.Categorie.find({ _id: { $in: objectIdArray } })
    }
  }
}
