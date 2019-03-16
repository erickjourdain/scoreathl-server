import { gql } from 'apollo-server-express'

export default gql`
type Score {
  id: ID!
  points: Int!
  resultats: [Resultat!]!
}

type Resultat {
  epreuve: Epreuve!
  resultat: [Float]!
  score: Int!
  statut: Int!
}
`
