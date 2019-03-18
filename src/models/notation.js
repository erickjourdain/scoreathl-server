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
          type: DataTypes.STRING,
          allowNull: false,
          get () {
            return this.getDataValue('points'). split(';')
          },
          set (val) {
            this.setDataValue('points', val.join(';'))
          }
        }
      },
      { 
        sequelize
      }
    )
  }
  
  static associate(models) {
    this.belongsTo(models.Epreuve, { as: 'epreuve' })
    this.belongsToMany(models.Categorie, { through: 'notation_categorie', as: 'categories' })
  }
}

export default Notation
