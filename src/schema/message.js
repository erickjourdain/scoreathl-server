import { gql } from 'apollo-server-express'

export default gql`
# extend type Query {
#   message(id: ID!): Message
#  messages: [Message]!
# }

extend type Mutation {
  createMessage(type: String!, data: MessageData!): Boolean!
#  deleteMessage(id: ID!): Boolean!
}

extend type Subscription {
  nouveauMessage: Message
#  suppressionMessage: ID
}

input MessageData {
  emoji: String
  text: String
}

type Message {
  type: String!
  text: String
  emoji: String
  createdAt: Date!
  user: User!
}
`
