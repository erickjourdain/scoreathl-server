import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  notation(id: ID!): Notation!
  notations: [Notation!]
}

type Notation {
  id: ID!
  points: [Float!]!
  epreuve: Epreuve!
  categories: [Categorie!]!
}
`
