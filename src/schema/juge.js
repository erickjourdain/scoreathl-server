import { gql } from 'apollo-server-express'

export default gql`
type Juge {
  id: ID!
  user: User!
  challenge: Challenge!
}

extend type Query {
  jugesCompetition(competition: ID!): [Juge]!
}

input JugeInput {
  user: ID!
  challenges: [ID!]!
}

extend type Mutation {
  defineCompetitionJuges(competition: ID!, juges: [JugeInput]!): Competition
}
`
