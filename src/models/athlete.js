import mongoose from 'mongoose'

const athleteSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  dateNaissance: {
    type: Date,
    required: true
  },
  categorie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: true
  },
  avatar: {
    type: String
  },
  score: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Score',
    required: true
  }
})

export default mongoose.model('Athlete', athleteSchema)
