import { gql } from 'apollo-server-express'

export default gql`
type Score {
  id: ID!
  challenge: Challenge!
  marques: [Float]!
  points: Int!
  statut: Int!
}
`
