import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Categorie extends Sequelize.Model {
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
          set(val) {
            this.setDataValue('nom', val.trim().toLowerCase())
          }
        },
        genre: {
          type: DataTypes.ENUM('M', 'F'),
          allowNull: false
        },
        anneeDebut: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        anneeFin: {
          type: DataTypes.INTEGER,
          allowNull: false
        }
      },
      { 
        sequelize
      }
    )
  }
}

export default Categorie
