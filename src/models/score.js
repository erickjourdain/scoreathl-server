import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Score extends Sequelize.Model {
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
          defaultValue: 0
        },
        marques: {
          type: DataTypes.ARRAY(DataTypes.REAL),
          allowNull: false
        },
        statut: {
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
    this.belongsTo(models.Challenge)
    this.belongsTo(models.Athlete)
  }

}

export default Score
