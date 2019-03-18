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
          type: DataTypes.REAL,
          default: 0
        }
      },
      { 
        sequelize,
        hooks: {
          beforeSave: (score) => {
            if (score.resultats && score.resultats.length) {
              score.points = 0
              score.resultats.forEach(res => {
                score.points += res.score
              })  
            }
          }
        }
      }
    )
  }
  
  static associate(models) {
    this.belongsToMany(models.Resultat, { through: 'resultat_score', as: 'resultats' })
  }

}

export default Score
