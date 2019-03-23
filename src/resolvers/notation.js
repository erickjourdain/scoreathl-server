export default {
  Query: {
    notation: (parent, { id }, { db }) => {
      return db.Notation.findByPk(id)
    },
    notations: (parent, args, { db }) => {
      return db.Notation.findAll()
    }
  },

  Notation: {
    epreuve: (notation) => {
      return notation.getEpreuve()
    },
    categories: (notation) => {
      return notation.getCategories()
    }
  }
}
