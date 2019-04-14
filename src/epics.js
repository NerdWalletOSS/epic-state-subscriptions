import _ from "lodash";
import { filter, map } from "rxjs/operators";
import uuid from "uuid/v4";
import { getStateSubscriptionOverridePaths } from "./selectors";
import { findUpdatedStateSubscriptionPaths } from "./utils";

// The state subscription path cache records cache entries for each distinct state subscription path the client has configured to watch.
// When the state in the cache is different from the current state of the Redux store, a cache miss has occurred
// and the client's path operator will receive the updated path in their path stream which they can then process.
const stateSubscriptionPathCache = {};

/**
 * This function wraps the state subscription path operator from each state subcription config
 * within a state subscription epic that filters updates so that only a stream of paths that they have configured
 * to watch are sent to the path operators when the path's value changes in the Redux state.
 *
 * @param {String} stateSubscriptionEpicConfig.key - The key to use to distinguish each state subscription configuration for the purpose
 * of dynamic path overrides configurable via the `overrideStateSubscriptionPaths` action
 * @param {Array} stateSubscriptionEpicConfig.paths - The paths that the client has configured to watch
 * initiated by the client
 * @param {Function} stateSubscriptionEpicConfig.pathOperator - The path operator function which takes a stream of updated string paths and performs
 * the desired client behaviour
 * @return {Array} - Returns an array of state subscription epics that wrap the path operators provided by the client
 * configuration which receive the stream of updated path changes
 */
export const createStateSubscriptionEpics = stateSubscriptionConfigs =>
  stateSubscriptionConfigs.map(
    // Map the state subscription configuration provided by the client to a state subscription epic.
    stateSubscriptionConfig => (action$, state$) => {
      const {
        key,
        paths: initialSubscriptionPaths,
        pathOperator
      } = stateSubscriptionConfig;
      // default to an arbitrary uuid if the client does not specify a desired key for the state subscription.
      const subscriptionKey = key || uuid();
      // Initialize the cache for the state subscription so that an update in the Redux store to that path will
      // cause a cache miss.
      stateSubscriptionPathCache[subscriptionKey] = {};
      // Modify the stream of actions received by the epic to return a stream of dirty string paths to be handled by the
      // state subscription path operator.
      const filteredStateSubscriptionPaths$ = action$.pipe(
        map(() => {
          const currentState = state$.value;
          const currentStateSubscriptionPathPatterns =
            getStateSubscriptionOverridePaths(currentState, subscriptionKey) ||
            initialSubscriptionPaths;

          // Filter the cache to only include entries for patterns that are still being subscribed to,
          // this way if the formerly subscribed path is re-added, there will be a cache miss
          const currentStateSubscriptionPathCache =
            stateSubscriptionPathCache[subscriptionKey];
          if (currentStateSubscriptionPathCache) {
            stateSubscriptionPathCache[subscriptionKey] = _.pick(
              currentStateSubscriptionPathCache,
              currentStateSubscriptionPathPatterns
            );
          }

          // Paths are collected in the format { path: path, pathPattern: pathPattern }
          return findUpdatedStateSubscriptionPaths(
            subscriptionKey,
            stateSubscriptionPathCache,
            currentStateSubscriptionPathPatterns,
            currentState
          );
        }),
        filter(paths => paths.length > 0)
      );
      // Returns the stream that was first processed into paths and then delivered to the client path operator
      // which executes client logic optionally triggering actions or performing side effects.
      return pathOperator(filteredStateSubscriptionPaths$, state$);
    }
  );
