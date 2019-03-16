import mongoose from 'mongoose'

const scoreSchema = new mongoose.Schema({
  points: {
    type: Number,
    default: 0
  },
  resultats: {
    type: [ {
      epreuve: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Epreuve'
      },
      resultat: [Number],
      score: Number,
      statut: {
        type: Number,
        enum: [0, 1, 2],
        default: 0
      }
    }]
  }
})

scoreSchema.pre('save', function(next) {
  this.points = 0
  this.resultats.forEach(element => {
    this.points += element.score
  })
  next()
})

export default mongoose.model('Score', scoreSchema)
