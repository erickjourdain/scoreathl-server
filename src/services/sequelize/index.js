import Sequelize from 'sequelize'
import config from '../../config'

const sqlite = config.get('sqlite')

let sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: `${sqlite.path}/${sqlite.file}`,
  pool: sqlite.pool
})

export default sequelize