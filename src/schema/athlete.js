import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  athlete(id: ID!): Athlete!
  athletes: [Athlete]!
}

type Athlete {
  id: ID!
  nom: String!
  prenom: String!
  annee: Int!
  categorie: Categorie!
  avatar: String
  scores: [Score!]!
}

extend type Mutation {
  athleteResultat(athlete: ID!, resultat: ResultatInput!): Athlete!
}

input ResultatInput {
  epreuve: ID!
  resultats: [Float!]!
}
`
