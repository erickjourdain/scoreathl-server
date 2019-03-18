import crypto from 'crypto'
import bcrypt from 'bcrypt'
import randtoken from 'rand-token'
import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

const Op = Sequelize.Op
const roles = ['admin', 'organisateur', 'juge', 'athlète']

class User extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: () => uuid()
        },
        nom: {
          type: DataTypes.STRING,
          allowNull: false,
          set(val) {
            this.setDataValue('nom', val.trim().toLowerCase())
          }
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          isEmail: {
            msg: 'Adresse email incorrect'
          },
          set(val) {
            this.setDataValue('email', val.trim().toLowerCase())
            const avatar = this.getDataValue('avatar')
            if (!avatar || avatar.indexOf('https://gravatar.com') === 0) {
              const hash = crypto.createHash('md5').update(val).digest('hex')
              this.setDataValue('avatar', `https://gravatar.com/avatar/${hash}?d=identicon`)
            }
            if (!this.getDataValue('nom')) {
              this.setDataValue('nom', val.replace(/^(.+)@.+$/, '$1'))
            } 
          }
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false
        },
        google: {
          type: DataTypes.STRING
        },
        facebook: {
          type: DataTypes.STRING
        },
        role: {
          type: DataTypes.ENUM(roles),
          default: 'athlète'
        },
        avatar: {
          type: DataTypes.STRING
        }
      },
      { 
        sequelize,
        hooks: {
          beforeSave: async (user) => {
            if (user.password) { 
              if (user.password.length < 6) {
                throw (new Error('Le mot de passe doit contenir au moins 6 caractères'))
              } else {
                const env = process.env.NODE_ENV || 'development'
                /* istanbul ignore next */
                const rounds = env === 'test' ? 1 : 9
                try {
                  let hash = await bcrypt.hash(user.password, rounds)
                  user.password = hash
                } catch (err) {
                  throw err
                }
              }
            }
          }
        }
      }
    )
  }

  static roles () {
    return roles
  }

  static createFromService ({ service, id, email, name, picture }) {
    return User.find({
      [Op.or]: [{ [`${service}`]: id }, { email } ]
    })
      .then(user => {
        if (user) {
          user[service] = id
          user.nom = name
          user.avatar = picture
          return user.save()
        } else {
          const password = randtoken.generate(16)
          return User.create({ [service]: id, email, password, nom: name, avatar: picture })
        }
      })
  }
  
  authenticate (password) {
    return bcrypt.compare(password, this.pwd).then((valid) => valid ? this : false)
  }

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
  }
}

export default User
