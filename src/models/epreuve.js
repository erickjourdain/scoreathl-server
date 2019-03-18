import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Epreuve extends Sequelize.Model {
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
          unique: true,
          set(val) {
            this.setDataValue('nom', val.trim().toLowerCase())
          }
        },
        unitePrincipale: {
          type: DataTypes.ENUM('sec', 'm', 'min'),
          allowNull: false
        },
        uniteSecondaire: {
          type: DataTypes.ENUM('', 'cm', 'sec'),
          allowNull: false
        },
        essais: {
          type: DataTypes.INTEGER,
          allowNull: false,
          default: 1
        },
        erreur: {
          type: DataTypes.STRING,
          allowNull: false,
          set(val) {
            this.setDataValue('erreur', val.trim().toLowerCase())
          }
        }
      },
      { 
        sequelize
      }
    )
  }
}

export default Epreuve
