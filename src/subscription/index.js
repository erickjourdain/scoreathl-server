import { PubSub } from 'apollo-server'

import * as EQUIPE_EVENTS from './equipe'
import * as ATHLETE_EVENTS from './athlete'
import * as USER_EVENTS from './user'


export const EVENTS = {
  EQUIPE: EQUIPE_EVENTS,
  ATHLETE: ATHLETE_EVENTS,
  USER: USER_EVENTS
}

export default new PubSub()

