export default {
  Query: {
    epreuve: (parent, { id }, { models }) => {
      return models.Epreuve.findById(id)
    },
    epreuves: (parent, args, { models }) => {
      return models.Epreuve.find({})
    }
  }
}
