import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Notation extends Sequelize.Model {
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
          type: DataTypes.ARRAY(DataTypes.REAL),
          allowNull: false
        }
      },
      { 
        sequelize
      }
    )
  }
  
  static associate(models) {
    this.belongsTo(models.Epreuve)
    this.belongsToMany(models.Categorie, { through: 'notation_categorie', as: 'categories' })
  }
}

export default Notation
