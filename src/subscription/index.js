import { PubSub } from 'apollo-server'

import * as EQUIPE_EVENTS from './equipe'
import * as ATHLETE_EVENTS from './athlete'
import * as USER_EVENTS from './user'
import * as MESSAGE_EVENTS from './message'
import * as CATEGORIE_EVENTS from './categorie'


export const EVENTS = {
  EQUIPE: EQUIPE_EVENTS,
  ATHLETE: ATHLETE_EVENTS,
  USER: USER_EVENTS,
  MESSAGE: MESSAGE_EVENTS,
  CATEGORIE: CATEGORIE_EVENTS
}

export default new PubSub()

