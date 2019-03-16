import mongoose from 'mongoose'

const jugeSchema = new mongoose.Schema({
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  epreuves: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epreuve'
    }],
    required: true
  }      
}, {
  timestamps: true
})

export default mongoose.model('Juge', jugeSchema)
