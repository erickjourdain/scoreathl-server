import Promise from 'bluebird'
import mongoose from 'mongoose'

mongoose.Promise = Promise

mongoose.connection.once('open', () => {
  console.log('connecté à la base de données')
})

/* istanbul ignore next */
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error: ' + err)
  process.exit(-1)
})

export default mongoose
