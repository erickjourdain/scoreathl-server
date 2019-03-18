import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  athlete(id: ID!): Athlete!
}

type Athlete {
  id: ID!
  nom: String!
  prenom: String!
  anneeNaissance: Int!
  categorie: Categorie!
  avatar: String
  score: Score!
}

extend type Mutation {
  # athleteResultat(athlete: ID!, resultats: [ResultatInput!]!): Athlete!
  athleteResultat(athlete: ID!, resultat: ResultatInput!): Athlete!
}

input ResultatInput {
  epreuve: ID!
  resultats: [Float!]!
}
`
