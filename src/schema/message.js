import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  message(id: ID!): Message!
  messages: [Message!]
}

extend type Mutation {
  createMessage(text: String!): Message!
  deleteMessage(id: ID!): Boolean!
}

type Message {
  id: ID!
  text: String!
  user: User!
}
`
