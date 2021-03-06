"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStateSubscription = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _operators = require("rxjs/operators");

var _v = _interopRequireDefault(require("uuid/v4"));

var _utils = require("./utils");

var _selectors = require("./selectors");

var _cache = require("./cache");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * An RxJS operator that converts a stream of actions into a stream of updated paths emitted
 * when a path monitored by the state subscription changes
 *
 * @param {Observable} state$ - The state stream from the epic that the operator requires
 * @param {Object} config - The config options for the state subscription operator
 * @param {String?} config.key - The key to use to distinguish each state subscription configuration for the purpose
 * of dynamic path overrides configurable via the `updateStateSubscriptionPaths` action
 * @param {Array?} config.paths - The paths that the client has configured to watch
 * initiated by the client
 * @return {Observable} - An observable that emits path change objects
 */
const createStateSubscription = (state$, config) => action$ => {
  // default to an arbitrary uuid if the client does not specify a desired key for the state subscription.
  const {
    key: subscriptionKey = (0, _v.default)(),
    paths: pathPatterns = []
  } = config; // Initialize the cache for the state subscription so that an update in the Redux store to that path will
  // cause a cache miss. If it already exists then the operator has already been used with that key
  // and on re-creation it should not clear the existing cache.

  if (!_cache.stateSubscriptionPathCache[subscriptionKey]) {
    _cache.stateSubscriptionPathCache[subscriptionKey] = {};
  } // Modify the stream of actions received by the epic to return a stream of dirty string paths to be handled by the
  // state subscription path operator.


  const filteredStateSubscriptionPaths$ = action$.pipe((0, _operators.map)(() => {
    const currentState = state$.value;
    const currentStateSubscriptionPathPatterns = (0, _selectors.getStateSubscriptionOverridePaths)(state$.value, subscriptionKey) || pathPatterns; // Filter the cache to only include entries for patterns that are still being subscribed to,
    // this way if the formerly subscribed path is re-added, there will be a cache miss

    const currentStateSubscriptionPathCache = _cache.stateSubscriptionPathCache[subscriptionKey];

    if (currentStateSubscriptionPathCache) {
      _cache.stateSubscriptionPathCache[subscriptionKey] = _lodash.default.pick(currentStateSubscriptionPathCache, currentStateSubscriptionPathPatterns);
    } // Paths are collected in the format { path: path, pathPattern: pathPattern }


    return (0, _utils.findUpdatedStateSubscriptionPaths)(subscriptionKey, currentStateSubscriptionPathPatterns, currentState);
  }), (0, _operators.filter)(paths => paths.length > 0)); // Returns a stream of paths that are emitted when changes have been detected

  return filteredStateSubscriptionPaths$;
};

exports.createStateSubscription = createStateSubscription;