import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Resultat extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: () => uuid()
        },
        points: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      { 
        sequelize
      }
    )
  }
  
  static associate(models) {
    this.belongsTo(models.Athlete)
    this.hasMany(models.Score)
  }
}

export default Resultat
