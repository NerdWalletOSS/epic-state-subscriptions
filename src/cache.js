import _ from "lodash";

// The state subscription path cache records cache entries for each distinct state subscription path the client has configured to watch.
// When the state in the cache is different from the current state of the Redux store, a cache miss has occurred
// and the client's path operator will receive the updated path in their path stream which they can then process.
export const stateSubscriptionPathCache = {};

export const getCachedPathsForSubscription = subscriptionKey => {
  const cachedPathPatterns = _.get(
    exports.stateSubscriptionPathCache,
    subscriptionKey
  );
  if (cachedPathPatterns) {
    return Object.keys(cachedPathPatterns).flatMap(cachedPathPatternKey => {
      return Object.keys(cachedPathPatterns[cachedPathPatternKey]).map(
        cachedPath => ({ path: cachedPath, pathPattern: cachedPathPatternKey })
      );
    });
  }
  return [];
};
