import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Equipe extends Sequelize.Model {
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
            this.setDataValue('nomUnique', val.trim().toLowerCase())
          }
        },
        nomUnique: {
          type: DataTypes.STRING,
          allowNull: false
        },
        avatar: {
          type: DataTypes.STRING
        },
        statut: {
          type: DataTypes.BOOLEAN,
          default: false
        }
      },
      { 
        sequelize
      }
    )
  }

  static associate(models) {
    this.adulte = this.belongsTo(models.Athlete)
    this.enfant = this.belongsTo(models.Athlete)
    this.competition = this.belongsTo(models.Competition)
    this.etiquette = this.belongsTo(models.Etiquette)
    this.proprietaire = this.belongsTo(models.User)
  }
}

export default Equipe
