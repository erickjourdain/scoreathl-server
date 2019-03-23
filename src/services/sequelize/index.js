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

let sequelize = new Sequelize(
  postgresql.database,
  postgresql.username,
  postgresql.password,
  {
    host: postgresql.host,
    dialect: 'postgres',
    pool: postgresql.pool
  }
)

export default sequelize