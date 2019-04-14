import _ from "lodash";

/**
 * A basic shallow equal comparison utility
 * @param {Object?} - The first object to be shallow compared
 * @param {Object?} - The second object to be shallow compared
 * @return {Boolean} Whether the two objects are shallow equal, defaults to true for === equality
 * of objects and primitives
 */
export const shallowEqual = (obj1, obj2) => {
  if (!obj1 || !obj2) {
    return obj1 === obj2;
  }
  return _.every(
    [...Object.keys(obj1), ...Object.keys(obj2)],
    key => obj1[key] === obj2[key]
  );
};

/**
 * Determines if there are dirty state subscription paths for a nested path where nested is defined as a
 * `*` property such as `state.x.*`. It traverses each top level key off of `state.x` and aggregates dirty paths.
 *
 * @param {String} stateSubscriptionKey - The state subscription identifier key
 * @param {String} stateSubscriptionPathCache - The subscription cache used to compare the current redux state with the cached value
 * @param {Array} pathComponents - The state subscription path delimited into an array by `.`
 * @param {Object} state - The current state of the Redux store
 * @param {Number} pathIndex - The path component index currently being traversed
 * @param {Function} callback - The dirty subscription callback to be invoked on each transformed nested path
 * @return {Array} The dirty paths in the redux store for the provided state subscription path
 */
const findNestedDirtySubscriptionPaths = (
  stateSubscriptionKey,
  stateSubscriptionPathCache,
  pathPattern,
  pathComponents,
  state,
  pathIndex,
  callback
) => {
  const stringPath = pathComponents.slice(0, pathIndex).join(".");
  const stateSlice = pathIndex === 0 ? state : _.get(state, stringPath);
  // If the state of the redux store is an object, we want to traverse each key under the object
  // to determine if the top-level keys are dirty.
  if (_.isPlainObject(stateSlice)) {
    return Object.keys(stateSlice).reduce((acc, slicePath) => {
      // For each traversed top-level key, check if it is a dirty path by creating its path components
      // array by taking the preceding components, its own key name, then the path components after it.
      // Consider the case where `state.x.y.z` exists and we are recursing on the state subscription `state.x.*.z`
      // Here it would be looping over all the keys for `state.x`, discover y and then recurse with the path `state.x.y.z`
      const newPathComponents = [
        ...pathComponents.slice(0, pathIndex),
        slicePath,
        ...pathComponents.slice(pathIndex + 1, pathComponents.length)
      ];
      return [
        ...acc,
        ...callback(
          stateSubscriptionKey,
          stateSubscriptionPathCache,
          pathPattern,
          newPathComponents,
          state,
          pathIndex
        )
      ];
    }, []);
  }
  return [];
};

/**
 * Determines if there is a dirty state subscription path for the given path such as `state.x`.
 *
 * @param {String} stateSubscriptionKey - The state subscription identifier key
 * @param {String} stateSubscriptionPathCache - The subscription cache used to compare the current redux state with the cached value
 * @param {String} pathPattern - The original state subscription path pattern
 * @param {Array} pathComponents - The state subscription path delimited into an array by `.`
 * @param {Object} state - The current state of the Redux store
 * @param {Number} pathIndex=0 - The path component index currently being traversed
 * @param {Array} foundPaths=[] - The current dirty state subscription paths found
 * @return {Array} The dirty paths in the redux store for the provided state subscription path
 */
const findDirtySubscriptionPaths = (
  stateSubscriptionKey,
  stateSubscriptionPathCache,
  pathPattern,
  pathComponents,
  state,
  pathIndex = 0,
  foundPaths = []
) => {
  const pathComponent = pathComponents[pathIndex];
  // Nested Recursive case:
  // If the current state subscription path component being traversed is a `*`, we want to check all paths
  // under the current state, so we call the helper method `findNestedDirtySubscriptionPaths` to check
  // the nested paths under the current state subscription path.
  if (pathComponent === "*") {
    return [
      ...foundPaths,
      ...findNestedDirtySubscriptionPaths(
        stateSubscriptionKey,
        stateSubscriptionPathCache,
        pathPattern,
        pathComponents,
        state,
        pathIndex,
        findDirtySubscriptionPaths
      )
    ];
    // Base case:
    // If we are traversing the path components and have reached the final one, we want to check the state
    // at the full string path re-created by joining the preceding and current state subscription path components with
    // the state subscription cache for that path.
  } else if (pathIndex === pathComponents.length - 1) {
    const stringPath = pathComponents.join(".");

    // The cached paths are retrieved from {subscriptionKey}{pathPattern}{cacheHitKey}
    // For example, a top level key of `group1` with a path pattern of `test.*` and 2 keys `foo` and
    // `bar` under the test slice of the redux store would store the cached entry for each at paths
    // `group1.test.*.foo and `group1.test.*.bar` in the cache
    const stateSubscriptionPathCacheForPattern = _.get(
      stateSubscriptionPathCache[stateSubscriptionKey],
      pathPattern
    );
    const subscriptionPath = _.get(
      stateSubscriptionPathCacheForPattern,
      stringPath
    );
    const stateSlice = _.get(state, stringPath);
    if (!shallowEqual(stateSlice, subscriptionPath)) {
      // If the state subscription path is dirty, update the state subscription cache for that path.
      // The cached paths are stored under the pattern {subscriptionKey}{pathPattern}{cacheHitKey}
      _.set(
        stateSubscriptionPathCache,
        [stateSubscriptionKey, pathPattern, stringPath],
        stateSlice
      );
      return [...foundPaths, { pathPattern, path: stringPath }];
    }
    return foundPaths;
  }
  // Recursive case:
  // Only a partial path has been traversed so far so it continues the recursion at the next path index
  return findDirtySubscriptionPaths(
    stateSubscriptionKey,
    stateSubscriptionPathCache,
    pathPattern,
    pathComponents,
    state,
    pathIndex + 1,
    foundPaths
  );
};

/**
 * Checks the given state subscription key to determine if any of its watched paths
 * are dirty in the Redux store.
 *
 * @param {String} stateSubscriptionKey - The state subscription identifier key
 * @param {String} stateSubscriptionPathCache - The subscription cache used to compare the current redux state with the cached value
 * @param {Array} paths - The paths that the individual state subscription config is subscribed to
 * @param {Object} state - The current Redux state
 * @return {Array} - The dirty state subscription paths
 */
// eslint-disable-next-line import/prefer-default-export
export const findUpdatedStateSubscriptionPaths = (
  stateSubscriptionKey,
  stateSubscriptionPathCache,
  pathPatterns,
  state
) =>
  // Aggregate all the paths that have changed together
  pathPatterns.reduce(
    (acc, pathPattern) => [
      ...acc,
      ...findDirtySubscriptionPaths(
        stateSubscriptionKey,
        stateSubscriptionPathCache,
        pathPattern,
        pathPattern.split("."),
        state
      )
    ],
    []
  );
