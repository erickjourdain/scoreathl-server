import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  categorie(id: ID!): Categorie!
  categories: [Categorie!]
}

extend type Mutation {
  updateCategories(categories: [CategorieInput!]!): Boolean
}

input CategorieInput {
  id: [ID!]!
  anneeDebut: Int!
  anneeFin: Int!
}

type Categorie {
  id: ID!
  nom: String!
  genre: String!
  anneeDebut: Int!
  anneeFin: Int!
  notations: [Notation!]!
}

extend type Subscription {
  modificationCategories: [Categorie!]
}
`
