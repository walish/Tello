import { combineReducers } from 'redux';
import { createSelector } from 'reselect';
import update from 'immutability-helper';

import {
  EPISODES_RECEIVE,
  START_TRACKING_NEW_SHOWS,
  REMOVE_SHOW,
  TOGGLE_EPISODE,
  USER_DATA_RECEIVE,
  USER_DATA_REQUEST,
  USER_DATA_FAILURE,
} from '../actions';
import { isEmpty } from '../utils';


const initialState = {
  token: null,
  isFetching: false,
  user: {},
};


const convertArrayToMap = list => (
  list.reduce((acc, item) => ({
    ...acc,
    [item.id]: item,
  }), {})
);

function userReducer(state = initialState.user, action) {
  switch (action.type) {
    case USER_DATA_RECEIVE: {
      return action.data;
    }

    case START_TRACKING_NEW_SHOWS: {
      // On the server, new shows have an empty `seenEpisodes` array added.
      // Because we fetch straight from TV Maze and don't wait for server
      // confirmation, we have to add this in manually here, so that the
      // data is consistent.
      const newShows = action.shows.map(show => ({
        ...show,
        seenEpisodes: [],
      }));

      // Convert the state shape so that it's map-like, instead of an array.
      const newShowsMap = convertArrayToMap(newShows);

      return {
        ...state,
        trackedShows: {
          ...state.trackedShows,
          ...newShowsMap,
        },
      };
    }

    case EPISODES_RECEIVE: {
      const { showId, episodes } = action;

      // Convert the list of episodes to a map
      const episodeMap = convertArrayToMap(episodes);

      // Add these episodes to the show
      const show = {
        ...state.trackedShows[showId],
        episodes: episodeMap
      };

      return update(state, {
        trackedShows: {
          [showId]: { $set: show },
        },
      });
    }

    case REMOVE_SHOW: {
      // TODO
      return state;
    }

    case TOGGLE_EPISODE: {
      const { showId, episodeId } = action;

      const showIndex = state.trackedShows.findIndex(s => s.id === showId);
      const show = state.trackedShows[showIndex];




      return state;
    }

    default: {
      return state;
    }
  }
}

function isFetchingReducer(state = initialState.isFetching, action) {
  switch (action.type) {
    case USER_DATA_REQUEST:
      return true;

    case USER_DATA_FAILURE:
    case USER_DATA_RECEIVE:
      return false;

    default:
      return state;
  }
}

function tokenReducer(state = initialState.token, action) {
  // At the moment, our token doesn't change throughout the session.
  // It's loaded on instantiation, if available.
  // We just store it in a reducer for convenience (and to derive things).
  return state;
}

export default combineReducers({
  token: tokenReducer,
  isFetching: isFetchingReducer,
  user: userReducer,
});


// Selectors
const getToken = state => state.auth.token;
const getIsFetching = state => state.auth.isFetching;
const getUser = state => state.auth.user;

// This doesn't _really_ tell us if we're logged in;
// It tells us if we're attempting a login, though, so it's safe to
// use for things like redirecting from login-only areas.
export const getIsLoggedIn = state => !!getToken(state);

export const getTrackedShows = createSelector(
  getUser,
  (user) => (user.trackedShows || [])
);

export const getTrackedShowIds = createSelector(
  getTrackedShows,
  (shows) => Object.keys(shows)
);


export const getTrackedShowsArray = createSelector(
  getTrackedShows,
  getTrackedShowIds,
  (shows, showIds) => showIds.map(showId => {
    const show = shows[showId];

    // If ths show has no episodes, no further array-making is required.
    if (!show.episodes) {
      return show;
    }

    // If the show has episodes, though, we need to turn the episode map
    // into an array as well.
    const episodes = Object.keys(show.episodes).map(episodeId => (
      show.episodes[episodeId]
    ));

    return {
      ...show,
      episodes,
    };
  })
);
