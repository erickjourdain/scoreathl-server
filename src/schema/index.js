import { gql } from 'apollo-server-express'
import userSchema from './user'
import messageSchema from './message'
import epreuveSchema from './epreuve'
import categorieSchema from './categorie'
import notationSchema from './notation'
import competitionSchema from './competition'
import jugeSchema from './juge'
import etiquetteSchema from './etiquette'
import scoreSchema from './score'
import athleteSchema from './athlete'
import equipeSchema from './equipe'
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
  messageSchema,
  epreuveSchema,
  categorieSchema,
  notationSchema,
  competitionSchema,
  jugeSchema,
  etiquetteSchema,
  scoreSchema,
  athleteSchema,
  equipeSchema,
  fileSchema
]
