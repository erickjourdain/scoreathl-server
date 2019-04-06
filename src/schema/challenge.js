import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  challenge(id: ID!): Challenge!
  challenges: [Challenge!]
}

type Challenge {
  id: ID!
  epreuve: Epreuve!
  essais: Int!
  statut: Boolean!
}

input ChallengeInput {
  epreuve: ID!
  essais: Int!
  statut: Boolean!
}
`
