import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  me: User
  user(id: ID!): User
  users: [User!],
  usersRole(roles: [String!]!): [User]
}

type User {
  id: ID!
  nom: String!
  email: String
  password: String
  service: String
  role: String!
  avatar: String
  createdAt: Date
  updatedAt: Date
}

type Login {
  token: String!
  user: User!
}

extend type Mutation {
  creerUser(nom: String!, email: String!, password: String!, role: String, avatar: Upload): User
  majUser(id: ID!, nom: String, email: String, role: String, avatar: Upload): User
  loginPassword(nom: String!, password: String!): Login
  loginGoogle(token: String!): Login
  loginFacebook(token: String!): Login
  forgetPwd(email: String!): Boolean
  resetPwd(password: String!, token: String!): Boolean
}

extend type Subscription {
  nouveauUser: User
  modificationUser: User
}
`
