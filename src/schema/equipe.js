import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  equipe(id: ID!): Equipe!
  competitionEquipes(id: ID!, statut: Boolean): [Equipe]!
}

extend type Mutation {
  creerEquipe(nom: String!, adulte: AthleteInputFull!, enfant: AthleteInputFull!, competition: ID!, pwd: String, avatar: Upload, etiquette: ID, statut: Boolean): Equipe!
  majEquipe(id: ID!, nom: String, adulte: AthleteInput, enfant: AthleteInput, avatar: Upload, etiquette: ID, statut: Boolean): Equipe!
  supprimerEquipe(id: ID!): Boolean!
}

input AthleteInputFull {
  nom: String!
  prenom: String!
  dateNaissance: Date!
  genre: String!
  avatar: Upload
}

input AthleteInput {
  nom: String
  prenom: String
  dateNaissance: Date
  genre: String
  avatar: Upload
}

type Equipe {
  id: ID!
  nom: String!
  adulte: Athlete!
  enfant: Athlete!
  competition: Competition!
  avatar: Upload
  etiquette: Etiquette
  statut: Boolean!
  points: Int!
  proprietaire: User!
}
`
