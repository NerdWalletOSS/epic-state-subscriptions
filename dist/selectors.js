"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStateSubscriptionOverridePaths = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A selector method used to retrieve the overridden state subscription paths currently being used
 * for the given state subscription key
 * @param {Object} state - The redux store
 * @param {String} subscriptionKey - the state subscription key for which paths should be retrieved
 * @return {Array?} - The state subscription override paths for the given state subscription key
 */
const getStateSubscriptionOverridePaths = (state, subscriptionKey) => _lodash.default.get(state, `stateSubscriptions.${subscriptionKey}.paths`);

exports.getStateSubscriptionOverridePaths = getStateSubscriptionOverridePaths;