import convict from 'convict'

var config = convict({
  env: {
    doc: `Environnement de l'application.`,
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  port: {
    doc: `Port de l'application.`,
    format: 'port',
    default: 8000,
    env: 'PORT',
    arg: 'port'
  },
  mongo: {
    host: {
      doc: 'Hôte hébergeant la base de données.',
      format: 'url',
      default: 'localhost'
    },
    port: {
      doc: `Le port d'accès de la base de données.`,
      format: 'port',
      default: 15434
    },
    name: {
      doc: `Le nom de la base de données.`,
      format: 'String',
      default: 'database'
    },
    user: {
      doc: `Le nom de l'utilisateur de la base de données.`,
      format: 'String',
      default: 'user'
    },
    pwd: {
      doc: `Le mot de passe pour accèder à la base de données.`,
      format: 'String',
      default: 'pwd'
    },
    options: {
      doc: `Object contenant les options de la base de données.`,
      format: 'Object',
      default: {
        "useNewUrlParser": true
      }
    }
  },
  secret: {
    master: {
      doc: `Clef principale de l'application.`,
      format: 'String',
      default: 'master_key'
    },
    jwt: {
      doc: `Clef de chiffrage des tokens.`,
      format: 'String',
      default: 'jwt_key'
    }
  },
  auth: {
    facebook: {
      clientId: {
        doc: `Identifiant de l'application facebook.`,
        format: 'String',
        default: 'fb_clientid'
      },
      clientSecret: {
        doc: `Clef secrète de l'application facebook.`,
        format: 'String',
        default: 'fb_secret'
      }
    },
    google: {
      clientId: {
        doc: `Identifiant de l'application google.`,
        format: 'String',
        default: 'google_clientid'
      },
      clientSecret: {
        doc: `Clef secrète de l'application google.`,
        format: 'String',
        default: 'google_secret'
      }
    }
  }
})

var env = config.get('env')
config.loadFile('./src/config/' + env + '.json')

config.validate({allowed: 'strict'})

module.exports = config
