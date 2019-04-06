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
  sqlite: {
    path: {
      doc: 'Répertoire de la base de données',
      format: 'String',
      default: ''
    },
    file: {
      doc: 'Fichier base de données',
      format: 'String',
      default: ''
    },
    pool: {
      max: {
        doc: 'Maximum pool connexion',
        format: 'nat',
        default: 5
      },
      min: {
        doc: 'Minimu pool connexion',
        format: 'nat',
        default: 0
      },
      acquire: {
        doc: 'Pool acquire',
        format: 'nat',
        default: 30000
      },
      idle: {
        doc: 'Pool idle',
        format: 'nat',
        default: 10000
      }
    }
  },
  postgresql: {
    database: {
      doc: "database",
      format: String,
      default: "scoreathl"
    },
    username:  {
      doc: "database username",
      format: String,
      default: "scoreathl"
    },
    password: {
      doc: "database username",
      format: String,
      default: "xxxxxxxx"
    },
    options: {
      host: {
        doc: "database host",
        format: String,
        default: "xxxxxxxx"
      },
      logging: {
        doc: 'Logging output',
        format: '*',
        default: console.log
      },
      dialect: {
        doc: 'database dialect',
        format: String,
        default: 'postgres'
      },
      pool: {
        max: {
          doc: 'Maximum pool connexion',
          format: 'nat',
          default: 5
        },
        min: {
          doc: 'Minimu pool connexion',
          format: 'nat',
          default: 0
        },
        acquire: {
          doc: 'Pool acquire',
          format: 'nat',
          default: 30000
        },
        idle: {
          doc: 'Pool idle',
          format: 'nat',
          default: 10000
        }
      }  
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

var env = config.get('env').trim()
config.loadFile('./src/config/' + env + '.json')

config.validate({allowed: 'strict'})

module.exports = config
