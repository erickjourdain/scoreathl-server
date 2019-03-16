import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const competitionSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  emplacement: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  image: {
    type: String,
    trim: true
  },
  statut: {
    type: Boolean,
    required: true,
    default: false
  },
  pwd: {
    type: String,
    required: true
  },
  organisateurs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
})

competitionSchema.pre('save', function (next) {
  if (!this.isModified('pwd')) return next()

  const env = process.env.NODE_ENV || 'development'

  /* istanbul ignore next */
  const rounds = env === 'test' ? 1 : 9

  bcrypt.hash(this.pwd, rounds).then((hash) => {
    this.pwd = hash
    next()
  }).catch(next)
})

competitionSchema.methods = {
  authenticate (password) {
    return bcrypt.compare(password, this.pwd).then((valid) => valid ? this : false)
  }
}

export default mongoose.model('Competition', competitionSchema)
