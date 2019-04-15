"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.overrideStateSubscriptionPaths = exports.makeActionCreator = void 0;

/**
 * @param {String} type - The name of the action
 * @return {Function} - The action creator function used to create redux actions
 */
const makeActionCreator = type => {
  const actionWrapper = payload => ({
    type,
    payload
  });

  actionWrapper.type = type;
  return actionWrapper;
};
/**
 * The action used to dynamically override the subscriptions paths for a state subscription
 * @param {Object} payload - The payload of the action to be processed by the reducer
 * @param {String} payload.stateSubscriptionKey - The state subscription key whose paths are to be overridden
 * @param {Array} payload.paths - The paths with which the state subscription key should be overridden
 */


exports.makeActionCreator = makeActionCreator;
const overrideStateSubscriptionPaths = makeActionCreator("UPDATE_STATE_SUBSCRIPTION_PATHS");
exports.overrideStateSubscriptionPaths = overrideStateSubscriptionPaths;