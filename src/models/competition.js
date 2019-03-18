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
          default: false
        },
        pwd: {
          type: DataTypes.STRING,
          allowNull: false,
          set(val) {
            const env = process.env.NODE_ENV || 'development'
    
            /* istanbul ignore next */
            const rounds = env === 'test' ? 1 : 9
          
            bcrypt.hash(val, rounds)
              .then((hash) => {
                this.setDataValue('pwd', hash)
              })
              .catch((err) => {
                throw err
              })
          }
        }
      },
      { 
        sequelize
      }
    )
  }
  
  authenticate (password) {
    return bcrypt.compare(password, this.pwd).then((valid) => valid ? this : false)
  }

  static associate(models) {
    this.belongsToMany(models.User, { through: 'organisateur_competition', as: 'organisateurs' })
  }
}

export default Competition
