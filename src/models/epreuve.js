import mongoose from 'mongoose'

const epreuveSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  unitePrincipale: {
    type: String,
    required: true,
    trim: true,
    enum: ['sec', 'm', 'min']
  },
  uniteSecondaire: {
    type: String,
    trim: true,
    enum: ['', 'cm', 'sec']
  },
  essais: {
    type: Number,
    default: 1
  },
  erreur: {
    type: String
  }
})

export default mongoose.model('Epreuve', epreuveSchema)
