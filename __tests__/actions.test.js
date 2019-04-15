import { initialState, stateSubscriptionReducer } from "../src/reducers";
import { overrideStateSubscriptionPaths } from "../src/actions";

describe("stateSubscriptionReducer", () => {
  describe("with no actions", () => {
    test("should have expected initial state", () => {
      expect(stateSubscriptionReducer(initialState)).toMatchSnapshot();
    });
  });

  describe("with an overrideStateSubscriptionPaths action", () => {
    test("should override the state subscription entry with the given paths", () => {
      expect(
        stateSubscriptionReducer(
          initialState,
          overrideStateSubscriptionPaths({
            key: "subscriptionKey",
            paths: ["testPath"]
          })
        )
      ).toMatchSnapshot();
    });
  });
});
