import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  categorie(id: ID!): Categorie!
  categories: [Categorie!]
}

type Categorie {
  id: ID!
  nom: String!
  genre: String!
  anneeDebut: Int!
  anneeFin: Int!
  notations: [Notation!]!
}
`
