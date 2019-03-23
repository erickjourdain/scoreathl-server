import Sequelize  from 'sequelize'
import sequelize from '../services/sequelize'

import Athlete from './athlete'
import Equipe from './equipe'
import Etiquette from './etiquette'
import Notation from './notation'
import Score from './score'
import User from './user'
// import Resultat from './resultat'
import Juge from './juge'
import Categorie from './categorie'
import Competition from './competition'
import Epreuve from './epreuve'
import Challenge from './challenge'

const models = {
  Athlete: Athlete.init(sequelize, Sequelize),
  Equipe: Equipe.init(sequelize, Sequelize),
  Etiquette: Etiquette.init(sequelize, Sequelize),
  Notation: Notation.init(sequelize, Sequelize),
  Score: Score.init(sequelize, Sequelize),
  User: User.init(sequelize, Sequelize),
  // Resultat: Resultat.init(sequelize, Sequelize),
  Juge: Juge.init(sequelize, Sequelize),
  Categorie: Categorie.init(sequelize, Sequelize),
  Competition: Competition.init(sequelize, Sequelize),
  Epreuve: Epreuve.init(sequelize, Sequelize),
  Challenge: Challenge.init(sequelize, Sequelize)
}

// Run `.associate` if it exists,
// ie create relationships in the ORM
Object.values(models)
  .filter(model => typeof model.associate === "function")
  .forEach(model => model.associate(models));

const db = {
  ...models,
  sequelize
}

export default db
