import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  competition(id: ID!): Competition!
  competitions: [Competition!]
}

type Competition {
  id: ID!
  nom: String!
  date: Date!
  emplacement: String!
  image: String
  statut: Boolean!
  pwd: String!
  challenges: [Challenge!]!
  organisateurs: [User!]!
  juges: [Juge!]
  equipes: [Equipe!]
}

extend type Mutation {
  creerCompetition(nom: String!, date: Date!, emplacement: String!, image: Upload, statut: Boolean, pwd: String!, organisateurs: [ID!]!, challenges: [ChallengeInput!]!): Competition
  majCompetition(id: ID!, nom: String, date: Date, emplacement: String, image: Upload, statut: Boolean, pwd: String, organisateurs: [ID!], challenges: [ChallengeInput!]): Competition
  delCompetition(id: ID!): Boolean
}
`