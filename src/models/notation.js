import mongoose from 'mongoose'

const notationSchema = new mongoose.Schema({
  points: {
    type: [Number],
    required: true
  },
  epreuveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Epreuve'
  },
  categoriesId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie'
  }]
})

export default mongoose.model('Notation', notationSchema)
