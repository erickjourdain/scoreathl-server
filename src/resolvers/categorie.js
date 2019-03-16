export default {
  Query: {
    categorie: (parent, { id }, { models }) => {
      return models.Categorie.findById(id)
    },
    categories: async (parent, args, { models }) => {
      return models.Categorie.find({})
    }
  },
  Categorie: {
    notations: (categorie, args, { models }) => {
      return models.Notation.find({ categoriesId: categorie.id }) 
    }
  }
}
