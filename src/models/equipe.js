import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Equipe extends Sequelize.Model {
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
          allowNull: false
        },
        nomUnique: {
          type: DataTypes.STRING,
          allowNull: false
        },
        avatar: {
          type: DataTypes.STRING
        },
        statut: {
          type: DataTypes.BOOLEAN,
          default: false
        }
      },
      { 
        sequelize
      }
    )
  }

  static associate(models) {
    this.belongsTo(models.Athlete, { as: 'adulte' })
    this.belongsTo(models.Athlete, { as: 'enfant' })
    this.belongsTo(models.Competition)
    this.belongsTo(models.Etiquette)
    this.belongsTo(models.User, { as: 'proprietaire' }) 
  }
}

export default Equipe
