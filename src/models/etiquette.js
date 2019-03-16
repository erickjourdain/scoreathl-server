import mongoose from 'mongoose'

const etiquetteSchema = new mongoose.Schema({
  valeur: {
    type: String,
    required: true,
    trim: true,
    unique: true
  }
})

export default mongoose.model('Etiquette', etiquetteSchema)
