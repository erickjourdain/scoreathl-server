import crypto from 'crypto'
import bcrypt from 'bcrypt'
import randtoken from 'rand-token'
import mongoose from 'mongoose'

const roles = ['admin', 'organisateur', 'juge', 'athlète']

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  services: {
    google: String,
    facebook: String
  },
  role: {
    type: String,
    enum: roles,
    default: 'athlète'
  },
  avatar: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

userSchema.path('email').set(function (email) {
  if (!this.avatar || this.avatar.indexOf('https://gravatar.com') === 0) {
    const hash = crypto.createHash('md5').update(email).digest('hex')
    this.avatar = `https://gravatar.com/avatar/${hash}?d=identicon`
  }

  if (!this.nom) {
    this.nom = email.replace(/^(.+)@.+$/, '$1')
  }

  return email
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()

  const env = process.env.NODE_ENV || 'development'

  /* istanbul ignore next */
  const rounds = env === 'test' ? 1 : 9

  bcrypt.hash(this.password, rounds).then((hash) => {
    this.password = hash
    next()
  }).catch(next)
})

userSchema.methods = {
  view (full) {
    let view = {}
    let fields = ['id', 'nom', 'avatar', 'role']

    if (full) {
      fields = [...fields, 'email', 'createdAt']
      if (this.services.facebook) {
        view.service = 'facebook'
      }
      if (this.services.google) {
        view.service = 'google'
      }
    }

    fields.forEach((field) => { view[field] = this[field] })

    return view
  },

  authenticate (password) {
    return bcrypt.compare(password, this.password).then((valid) => valid ? this : false)
  }
}

userSchema.statics = {
  roles,
  createFromService ({ service, id, email, name, picture }) {
    return this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] }).then((user) => {
      if (user) {
        user.services[service] = id
        user.nom = name
        user.avatar = picture
        return user.save()
      } else {
        const password = randtoken.generate(16)
        return this.create({ services: { [service]: id }, email, password, nom: name, avatar: picture })
      }
    })
  }
}

export default mongoose.model('User', userSchema)
