import { gql } from 'apollo-server-express'

export default gql`
extend type Query {
  equipe(id: ID!): Equipe!
  competitionEquipes(competition: ID!, cursor: Date, limit: Int): EquipeConnection!
}

extend type Mutation {
  creerEquipe(nom: String!, adulte: AthleteInputFull!, enfant: AthleteInputFull!, competition: ID!, pwd: String, avatar: Upload, etiquette: ID, statut: Boolean): Equipe!
  majEquipe(id: ID!, nom: String, adulte: AthleteInput, enfant: AthleteInput, avatar: Upload, etiquette: ID, statut: Boolean): Equipe!
  planifierEquipe(id: ID!, challenge: ID!, statut: Int!): Boolean!
  supprimerEquipe(id: ID!): Boolean!
}

extend type Subscription {
  nouvelleEquipe(competition: ID!): SubEquipe
  modificationEquipe(competition: ID!): SubEquipe
  suppressionEquipe(competition: ID!): SubEquipe
}

input AthleteInputFull {
  nom: String!
  prenom: String!
  annee: Int!
  genre: String!
  avatar: Upload
}

input AthleteInput {
  nom: String
  prenom: String
  annee: Int
  genre: String
  avatar: Upload
}

type EquipeConnection {
  equipes: [Equipe]!
  endCursor: Date 
}

type SubEquipe {
  competition: ID!
  equipe: ID!
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
  createdAt: Date!
}
`
