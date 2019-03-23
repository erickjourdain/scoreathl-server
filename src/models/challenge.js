import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Challenge extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: () => uuid()
        },
        essais: {
          type: DataTypes.INTEGER,
          allowNull: false,
          default: 1
        }
      },
      { 
        sequelize
      }
    )
  }
  
  static associate(models) {
    this.hasMany(models.Juge)
    this.belongsTo(models.Competition)
    this.belongsTo(models.Epreuve)
  }
}

export default Challenge