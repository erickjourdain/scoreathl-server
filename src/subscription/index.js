import { PubSub } from 'apollo-server'

import * as EQUIPE_EVENTS from './equipe'

export const EVENTS = {
  EQUIPE: EQUIPE_EVENTS
}

export default new PubSub()

