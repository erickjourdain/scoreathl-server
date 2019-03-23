export default {
  Query: {
    categorie: (parent, { id }, { db }) => {
      return db.Categorie.findByPk(id)
    },
    categories: async (parent, args, { db }) => {
      return db.Categorie.findAll()
    }
  },
  Categorie: {
    notations: (categorie, args, { db }) => {
      return categorie.getNotations() 
    }
  }
}
