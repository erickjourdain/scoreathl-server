import Sequelize from 'sequelize'
import config from '../../config'

// const sqlite = config.get('sqlite')
const postgresql = config.get('postgresql')

/*
let sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: `${sqlite.path}/${sqlite.file}`,
  pool: sqlite.pool
})
*/

postgresql.options.logging = (postgresql.options.logging) ? console.log : postgresql.options.logging

let sequelize = new Sequelize(
  postgresql.database,
  postgresql.username,
  postgresql.password,
  postgresql.options
  /*
  {
    host: postgresql.host,
    dialect: 'postgres',
    logging: !postgresql.logging,
    pool: postgresql.pool
  }
  */
)

export default sequelize