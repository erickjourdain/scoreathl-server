import mongoose from 'mongoose'

const equipeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  nomUnique: {
    type: String
  },
  adulte: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  enfant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  avatar: {
    type: String
  },
  etiquette: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etiquette',
  },
  statut: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

equipeSchema.pre('save', function (next) {
  if (!this.isModified('nom')) return next()
  this.nomUnique = this.nom.toLowerCase()
  next()
})

export default mongoose.model('Equipe', equipeSchema)
