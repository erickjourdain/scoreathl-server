import { gql } from 'apollo-server-express'

export default gql`
type File {
  id: ID!
  path: String!
  nom: String!
  mimetype: String!
}

extend type Mutation {
  singleUpload(file: Upload!): File!
  multipleUpload(files: [Upload!]!): [File!]!
}
`
