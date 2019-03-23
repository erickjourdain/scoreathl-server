import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  epreuve(id: ID!): Epreuve!
  epreuves: [Epreuve!]
}

type Epreuve {
  id: ID!
  nom: String!
  unitePrincipale: String!
  uniteSecondaire: String
  erreur: String!
}
`
