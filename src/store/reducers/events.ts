const ADD_EVENT = '@@manager/ADD_EVENT';
const REMOVE_EVENT = '@@manager/REMOVE_EVENT';

import { pathOr } from 'ramda';

export const addEvent = (event: Partial<Linode.Event>) => {
  return {
    type: ADD_EVENT,
    ...event
  }
}

export const removeEvent = (event: Partial<Linode.Event>) => {
  return {
    type: REMOVE_EVENT,
    ...event
  }
}

export const defaultState = [];

interface AddEvent extends Partial<Linode.Event> {
  type: typeof ADD_EVENT,
}

interface RemoveEvent extends Partial<Linode.Event> {
  type: typeof REMOVE_EVENT,
}

type ActionTypes = AddEvent | RemoveEvent;

const events = (state = defaultState, action: ActionTypes) => {
  switch (action.type) {
    case ADD_EVENT:
      return [
        ...state,
        {
          id: pathOr(null, ['entity', 'id'], action),
          action: action.action,
          entity: action.entity,
        }
      ]
    case REMOVE_EVENT:
      return state.filter((event: Partial<Linode.Event>) => {
        return event.id !== action.id;
      })
    default:
      return state;
  }
}

export default events;

