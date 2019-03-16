import { gql } from 'apollo-server-express'

export default gql`
type Juge {
  id: ID!
  competition: Competition!
  user: User!
  epreuves: [Epreuve!]!
}

extend type Query {
  jugesCompetition(competition: ID!): [Juge]!
}

input JugeInput {
  user: ID!
  epreuves: [ID!]!
}

extend type Mutation {
  defineCompetitionJuges(competition: ID!, juges: [JugeInput]!): Competition
}
`
