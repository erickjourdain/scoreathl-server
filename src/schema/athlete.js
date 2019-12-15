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
  genre: String!
  categorie: Categorie!
  avatar: String
  scores: [Score!]!
  points: Float!
}

extend type Mutation {
  athleteResultat(athlete: ID!, resultat: ResultatInput!): Athlete!
  athleteCategorie(athlete: ID!, annee: Int!, genre: String!): Athlete!
}

extend type Subscription {
  modificationAthlete(competition: ID!): SubEquipe
}

input ResultatInput {
  challenge: ID!
  resultats: [Float!]!
}
`
