import { overrideStateSubscriptionPaths } from "./actions";

export const initialState = {};

// The state subscription reducer that can be optionally included to dynamically override subscription
// paths using the overrideStateSubscriptionPaths action
export const stateSubscriptionReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case overrideStateSubscriptionPaths.type: {
      const {
        payload: { key, paths }
      } = action;
      return Object.assign({}, state, {
        [key]: paths
      });
    }
    default:
      return state;
  }
};
