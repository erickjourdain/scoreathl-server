import http from 'http'
import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'

import { jwt } from './services/passport'
import config from './config'
import sequelize from './services/sequelize'
import express from './services/express'
import api from './api'

import schema from './schema'
import resolvers from './resolvers'
import db from './models'

const apiRoot = process.env.API_ROOT || ''
const app = express(apiRoot, api)

global.__publicdir = (process.env.NODE_ENV === 'production') ? __dirname.replace('dist', 'public') : __dirname.replace('src', 'public')

sequelize.authenticate()
  .then(async () => {
    console.log('connecté à la base de données')
    if (config.get('env') === 'test') {
      await require('./test/initDB').initDb()
    }
  })
  .catch((err) => {
    console.error('database connection error: ' + err)
    process.exit(-1)
  })

app.use('/graphql', jwt(), graphqlUploadExpress({ maxFileSize: 2000000, maxFiles: 5 }))

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  uploads: false,
  context: ({ req, connection }) => {
    if (connection) {
      return {
        db
      }
    }
    if (req) {
      return {
        sequelize,
        db,
        user: req.user
      }
    }
  }
})

server.applyMiddleware({ app, paths: '/graphql' })
const httpServer = http.createServer(app)
server.installSubscriptionHandlers(httpServer)

httpServer.listen({ port: config.get('port') }, () => {
  console.log(`Apollo server on http://localhost:${config.get('port')}/graphql`)
})
