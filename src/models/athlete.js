
import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Athlete extends Sequelize.Model {
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
        prenom: {
          type: DataTypes.STRING,
          allowNull: false,
          set(val) {
            this.setDataValue('prenom', val.trim().toLowerCase())
          }
        },
        annee: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        avatar: {
          type: DataTypes.STRING
        }
      },
      { 
        sequelize
      }
    )
  }

  static associate(models) {
    this.categorie = this.belongsTo(models.Categorie)
    this.score = this.belongsTo(models.Score)
  }
}

export default Athlete
