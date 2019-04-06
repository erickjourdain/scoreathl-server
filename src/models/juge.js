import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Juge extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
      { 
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: () => uuid()
        }
      },
      { 
        sequelize
      }
    )
  }
  
  static associate(models) {
    this.belongsTo(models.Competition, { as: 'competition' })
    this.belongsTo(models.Challenge)
    this.belongsTo(models.User)
    // this.belongsToMany(models.Challenge, { through: 'challenge_juge', as: 'challenges' })
  }
}

export default Juge
