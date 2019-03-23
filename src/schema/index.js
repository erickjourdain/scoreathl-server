import { gql } from 'apollo-server-express'
import userSchema from './user'
//import messageSchema from './message'
import epreuveSchema from './epreuve'
import categorieSchema from './categorie'
import notationSchema from './notation'
import etiquetteSchema from './etiquette'
import competitionSchema from './competition'
import jugeSchema from './juge'
import scoreSchema from './score'
import athleteSchema from './athlete'
import equipeSchema from './equipe'
import challengeSchema from './challenge'
import fileSchema from './file'

const linkSchema = gql`
  scalar Date
  scalar Upload

  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`

export default [
  linkSchema,
  userSchema, 
  // messageSchema,
  epreuveSchema,
  categorieSchema,
  notationSchema,
  etiquetteSchema,
  challengeSchema,
  competitionSchema,
  jugeSchema,
  scoreSchema,
  athleteSchema,
  equipeSchema,
  fileSchema
]
