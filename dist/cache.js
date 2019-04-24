"use strict";

require("core-js/modules/es.array.flat-map");

require("core-js/modules/es.array.unscopables.flat-map");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCachedPathsForSubscription = exports.stateSubscriptionPathCache = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The state subscription path cache records cache entries for each distinct state subscription path the client has configured to watch.
// When the state in the cache is different from the current state of the Redux store, a cache miss has occurred
// and the client's path operator will receive the updated path in their path stream which they can then process.
const stateSubscriptionPathCache = {};
exports.stateSubscriptionPathCache = stateSubscriptionPathCache;

const getCachedPathsForSubscription = subscriptionKey => {
  const cachedPathPatterns = _lodash.default.get(exports.stateSubscriptionPathCache, subscriptionKey);

  if (cachedPathPatterns) {
    return Object.keys(cachedPathPatterns).flatMap(cachedPathPatternKey => {
      return Object.keys(cachedPathPatterns[cachedPathPatternKey]).map(cachedPath => ({
        path: cachedPath,
        pathPattern: cachedPathPatternKey
      }));
    });
  }

  return [];
};

exports.getCachedPathsForSubscription = getCachedPathsForSubscription;