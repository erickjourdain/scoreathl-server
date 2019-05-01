import uuid from 'uuid/v4'
import Sequelize from 'sequelize'

class Message extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: () => uuid()
        },
        type: {
          allowNull: false,
          type: DataTypes.ENUM('text', 'emoji') ,
          defaultValue: 'text'
        },
        text: {
          type: DataTypes.TEXT
        },
        emoji: {
          type: DataTypes.STRING
        }
      },
      { 
        sequelize
      }
    )
  }

  static associate(models) {
    this.belongsTo(models.User) 
  }
}

export default Message
