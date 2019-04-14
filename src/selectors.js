import _ from "lodash";

/**
 * A selector method used to retrieve the overridden state subscription paths currently being used
 * for the given state subscription key
 * @param {Object} state - The redux store
 * @param {String} subscriptionKey - the state subscription key for which paths should be retrieved
 * @return {Array?} - The state subscription override paths for the given state subscription key
 */
export const getStateSubscriptionOverridePaths = (state, subscriptionKey) =>
  _.get(state, `stateSubscriptions.${subscriptionKey}.paths`);
