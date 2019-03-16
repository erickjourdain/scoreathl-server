import mongoose from 'mongoose'

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    enum: ['M', 'F']
  },
  anneeDebut: {
    type: Number,
    required: true
  },
  anneeFin: {
    type: Number,
    required: true
  }
})

export default mongoose.model('Categorie', categorieSchema)
