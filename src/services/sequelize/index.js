import Sequelize from 'sequelize'
import config from '../../config'

const postgresql = config.get('postgresql')

postgresql.options.logging = (postgresql.options.logging) ? console.log : postgresql.options.logging

let sequelize = new Sequelize(
  postgresql.database,
  postgresql.username,
  postgresql.password,
  postgresql.options
)

export default sequelize