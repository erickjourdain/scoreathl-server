export default {
  Query: {
    epreuve: (parent, { id }, { db }) => {
      return db.Epreuve.findByPk(id)
    },
    epreuves: (parent, args, { db }) => {
      return db.Epreuve.findAll()
    }
  }
}
