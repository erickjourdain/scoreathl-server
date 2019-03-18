import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Etiquette extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: () => uuid()
        },
        valeur: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          set(val) {
            this.setDataValue('valeur', val.trim().toLowerCase())
          }
        }
      },
      { 
        sequelize
      }
    )
  }
}

export default Etiquette
