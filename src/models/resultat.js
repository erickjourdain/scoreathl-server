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
        score: {
          type: DataTypes.INTEGER,
          allowNull: false,
          default: 0
        },
        marques: {
          type: DataTypes.ARRAY(DataTypes.REAL),
          allowNull: false
        },
        statut: {
          type: DataTypes.ENUM(0, 1, 2),
          allowNull: false,
          default: 0
        }
      },
      { 
        sequelize
      }
    )
  }
  
  static associate(models) {
    this.epreuve = this.belongsTo(models.Epreuve)
  }
}

export default Resultat
