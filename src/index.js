import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'
import { jwt } from './services/passport'

import config from './config'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'

import schema from './schema'
import resolvers from './resolvers'
import models from './models'

const apiRoot = process.env.API_ROOT || ''
const app = express(apiRoot, api)

const mongo = config.get('mongo')

global.__publicdir = __dirname.replace('src', 'public')

mongoose.connect(`mongodb://${mongo.user}:${mongo.pwd}@${mongo.host}:${mongo.port}/${mongo.name}`, mongo.options)

app.use('/graphql', jwt(), graphqlUploadExpress({ maxFileSize: 2000000, maxFiles: 5 }))

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  uploads: false,
  context: ({ req }) => {
    return {
      models,
      user: req.user
    }
  }
})

server.applyMiddleware({ app, paths: '/graphql' })

app.listen({ port: 4000 }, () => {
  console.log('Apollo server on http://localhost:4000/graphql')
})
