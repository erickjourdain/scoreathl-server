
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
          allowNull: false
        },
        prenom: {
          type: DataTypes.STRING,
          allowNull: false
        },
        annee: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        genre: {
          type: DataTypes.ENUM('F', 'M'),
          allowNull: false
        },
        avatar: {
          type: DataTypes.STRING,
          defaultValue: null
        }
      },
      { 
        sequelize
      }
    )
  }

  static associate(models) {
    this.belongsTo(models.Categorie)
    this.hasMany(models.Score)
  }
}

export default Athlete
