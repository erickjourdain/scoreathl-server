import uuid from 'uuid/v4'
import bcrypt from 'bcrypt'
import Sequelize from 'sequelize'

class Competition extends Sequelize.Model {
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
        emplacement: {
          type: DataTypes.STRING,
          allowNull: false,
          set(val) {
            this.setDataValue('emplacement', val.trim().toLowerCase())
          }
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        image: {
          type: DataTypes.STRING
        },
        statut: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        pwd: {
          type: DataTypes.STRING,
          allowNull: false
        }
      },
      { 
        sequelize /*,
        hooks: {
          beforeSave: async (competition) => {
            if (competition.pwd) { 
              if (competition.pwd.length < 6) {
                throw (new Error('Le mot de passe doit contenir au moins 6 caractères'))
              } else {
                const env = process.env.NODE_ENV || 'development'
                */
                /* istanbul ignore next */
                /*
                const rounds = env === 'test' ? 1 : 9
                try {
                  let hash = await bcrypt.hash(competition.pwd, rounds)
                  competition.pwd = hash
                } catch (err) {
                  throw err
                }
              }
            }
          }
        } */
      }
    )
  }
  
  async authenticate (password) {
    try {
      const valid = await bcrypt.compare(password, this.pwd)
      return (valid) ? this : false 
    } catch (error) {
      throw error
    }
  }

  static associate(models) {
    this.belongsToMany(models.User, { through: 'organisateur_competition', as: 'organisateurs' })
    this.hasMany(models.Equipe)
    this.hasMany(models.Challenge)
    this.hasMany(models.Juge)
  }
}

export default Competition
