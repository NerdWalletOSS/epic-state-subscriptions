"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stateSubscriptionReducer = exports.initialState = void 0;

var _actions = require("./actions");

const initialState = {}; // The state subscription reducer that can be optionally included to dynamically override subscription
// paths using the overrideStateSubscriptionPaths action

exports.initialState = initialState;

const stateSubscriptionReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case _actions.overrideStateSubscriptionPaths.type:
      {
        const {
          payload: {
            stateSubscriptionKey,
            paths
          }
        } = action;
        return Object.assign({}, state, {
          [stateSubscriptionKey]: paths
        });
      }

    default:
      return state;
  }
};

exports.stateSubscriptionReducer = stateSubscriptionReducer;