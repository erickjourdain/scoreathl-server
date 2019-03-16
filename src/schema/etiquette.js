import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  etiquette(id: ID!): Etiquette!
  etiquettes: [Etiquette!]
}

type Etiquette {
  id: ID!
  valeur: String!
  utilisee: Boolean!
}

extend type Mutation {
  creerEtiquette(valeur: String!): Etiquette!
  supprimerEtiquette(id: ID!): Boolean!
}
`
