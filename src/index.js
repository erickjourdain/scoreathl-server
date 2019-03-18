import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'
import { jwt } from './services/passport'

// import config from './config'
import sequelize from './services/sequelize'
import express from './services/express'
import api from './api'

import schema from './schema'
import resolvers from './resolvers'
import db from './models'

const apiRoot = process.env.API_ROOT || ''
const app = express(apiRoot, api)

global.__publicdir = __dirname.replace('src', 'public')

sequelize.authenticate()
  .then(() => {
    console.log('connecté à la base de données')
  })
  .catch((err) => {
    console.error('database connection error: ' + err)
    process.exit(-1)
  })
/*
app.use('/graphql', jwt(), graphqlUploadExpress({ maxFileSize: 2000000, maxFiles: 5 }))

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  uploads: false,
  context: ({ req }) => {
    return {
      db,
      user: req.user
    }
  }
})

server.applyMiddleware({ app, paths: '/graphql' })
*/
app.listen({ port: 4000 }, () => {
  console.log('Apollo server on http://localhost:4000/graphql')
})
