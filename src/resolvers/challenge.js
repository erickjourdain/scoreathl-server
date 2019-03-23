export default {
  Query: {
    challenge: (parent, { id }, { db }) => {
      return db.Challenge.findByPk(id)
    },
    challenges: (parent, args, { db }) => {
      return db.Challenge.findAll()
    }
  },
  Challenge: {
    epreuve: (challenge) => {
      return challenge.getEpreuve()
    }
  }
}
