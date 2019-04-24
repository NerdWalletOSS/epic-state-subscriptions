import * as cache from "../src/cache";

describe("#getCachedPathsForSubscription", () => {
  describe("with paths cached for the given subscription key", () => {
    const stateSubscriptionKey = "testSubscription";

    beforeEach(() => {
      cache.stateSubscriptionPathCache = {
        testSubscription: {
          "test.*": {
            test: true
          }
        }
      };
    });

    test("should return the paths that are cached", () => {
      expect(cache.getCachedPathsForSubscription(stateSubscriptionKey)).toEqual(
        [{ path: "test", pathPattern: "test.*" }]
      );
    });
  });

  describe("with no paths cached for the given subscription key", () => {
    const stateSubscriptionKey = "testSubscription";

    beforeEach(() => {
      cache.stateSubscriptionPathCache = {
        testSubscription: {}
      };
    });

    test("should return the paths that are cached", () => {
      expect(cache.getCachedPathsForSubscription(stateSubscriptionKey)).toEqual(
        []
      );
    });
  });
});
