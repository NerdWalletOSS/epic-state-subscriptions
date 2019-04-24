import _ from "lodash";
import { ActionsObservable, StateObservable } from "redux-observable";
import { mergeMap, tap, toArray } from "rxjs/operators";
import { Subject } from "rxjs";
import { createStateSubscription } from "../src/operators";
import { makeActionCreator } from "../src/actions";
import * as selectors from "../src/selectors";

let store;
let paths;
let triggerPayload;
let handledPayload;
let stateSubscriptionEpic;
let stateSubject;
let action$;
let state$;

const createActionStream = (...actions) =>
  ActionsObservable.of(...actions).pipe(
    tap(action => {
      // Simulate the redux store being updated by emitting the new store to our
      // mock state subject as the first side effect that occurs for each action in the action stream
      stateSubject.next(_.merge(store, action.payload));
      store = state$.value;
    })
  );

const triggerSubscriptionChangeAction = makeActionCreator(
  "TRIGGER_SUBSCRIPTION_CHANGE_ACTION"
);
const handleSubscriptionChangeAction = makeActionCreator(
  "HANDLE_SUBSCRIPTION_CHANGE_ACTION"
);

describe("state subscriptions epic", () => {
  beforeEach(() => {
    store = {};
    stateSubject = new Subject();
  });

  describe("with simple paths", () => {
    let stateSubscriptionEpic = (action$, state$) =>
      action$.pipe(
        createStateSubscription(state$, {
          paths
        }),
        mergeMap(() =>
          createActionStream(
            handleSubscriptionChangeAction({ testPath: handledPayload })
          )
        )
      );

    beforeEach(() => {
      paths = ["testPath"];
      triggerPayload = { triggered: true };
      handledPayload = { handled: true };
    });

    test("should trigger path changesets with all the expected params", () => {
      const oldStateSubscriptionEpic = stateSubscriptionEpic;
      stateSubscriptionEpic = (action$, state$) =>
        action$.pipe(
          createStateSubscription(state$, {
            paths
          }),
          mergeMap(({ prevState, nextState, path, pathPattern }) => {
            expect(prevState).toEqual(undefined);
            expect(nextState).toEqual(handledPayload);
            expect(path).toEqual("testPath");
            expect(pathPattern).toEqual("testPath");
            return createActionStream(
              handleSubscriptionChangeAction({ testPath: handledPayload })
            );
          })
        );
      stateSubscriptionEpic = oldStateSubscriptionEpic;
    });

    describe("with a primitive change", () => {
      beforeEach(() => {
        triggerPayload = false;
        handledPayload = true;
      });

      test("should trigger for changes to monitored paths in the store", async () => {
        state$ = new StateObservable(stateSubject, store);
        action$ = createActionStream(
          triggerSubscriptionChangeAction({ testPath: triggerPayload })
        );

        const testResult = await stateSubscriptionEpic(action$, state$)
          .pipe(toArray())
          .toPromise();
        expect(testResult.length).toEqual(1);
        expect(testResult[0].type).toEqual("HANDLE_SUBSCRIPTION_CHANGE_ACTION");
        expect(store.testPath).toEqual(true);
      });
    });

    test("should trigger for changes to monitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ testPath: triggerPayload })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(1);
      expect(testResult[0].type).toEqual("HANDLE_SUBSCRIPTION_CHANGE_ACTION");
      expect(store.testPath.triggered).toEqual(true);
      expect(store.testPath.handled).toEqual(true);
    });

    test("should not trigger for changes to unmonitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ randomPath: {} })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(0);
      expect(store.testPath).toEqual(undefined);
    });
  });

  describe("with non-terminal nested paths", () => {
    beforeEach(() => {
      paths = ["testPath.*.leafPath"];
      triggerPayload = { nested: { leafPath: { triggered: true } } };
      handledPayload = { nested: { leafPath: { handled: true } } };
      stateSubscriptionEpic = stateSubscriptionEpic = (action$, state$) =>
        action$.pipe(
          createStateSubscription(state$, {
            paths
          }),
          mergeMap(() =>
            createActionStream(
              handleSubscriptionChangeAction({ testPath: handledPayload })
            )
          )
        );
    });

    test("should trigger for changes to monitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ testPath: triggerPayload })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(1);
      expect(testResult[0].type).toEqual("HANDLE_SUBSCRIPTION_CHANGE_ACTION");
      expect(store.testPath.nested.leafPath.triggered).toEqual(true);
      expect(store.testPath.nested.leafPath.handled).toEqual(true);
    });

    test("should not trigger for changes to unmonitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ randomPath: {} })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(0);
      expect(store.testPath).toEqual(undefined);
    });
  });

  describe("with terminal nested paths", () => {
    beforeEach(() => {
      paths = ["testPath.*"];
      triggerPayload = { nested: { triggered: true } };
      handledPayload = { nested: { handled: true } };
      stateSubscriptionEpic = stateSubscriptionEpic = (action$, state$) =>
        action$.pipe(
          createStateSubscription(state$, {
            paths
          }),
          mergeMap(() =>
            createActionStream(
              handleSubscriptionChangeAction({ testPath: handledPayload })
            )
          )
        );
    });

    test("should trigger for changes to monitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ testPath: triggerPayload })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(1);
      expect(testResult[0].type).toEqual("HANDLE_SUBSCRIPTION_CHANGE_ACTION");
      expect(store.testPath.nested.triggered).toEqual(true);
      expect(store.testPath.nested.handled).toEqual(true);
    });

    test("should not trigger for changes to unmonitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ randomPath: {} })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(0);
      expect(store.testPath).toEqual(undefined);
    });
  });

  describe("with only a nested path", () => {
    beforeEach(() => {
      paths = ["*"];
      triggerPayload = { triggered: true };
      handledPayload = { handled: true };
      stateSubscriptionEpic = stateSubscriptionEpic = (action$, state$) =>
        action$.pipe(
          createStateSubscription(state$, {
            paths
          }),
          mergeMap(() =>
            createActionStream(
              handleSubscriptionChangeAction({ testPath: handledPayload })
            )
          )
        );
    });

    test("should trigger for changes to monitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ testPath: triggerPayload })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(1);
      expect(testResult[0].type).toEqual("HANDLE_SUBSCRIPTION_CHANGE_ACTION");
      expect(store.testPath.triggered).toEqual(true);
      expect(store.testPath.handled).toEqual(true);
    });
  });

  describe("with a dynamic path configuration", () => {
    let getStateSubscriptionOverridePathsSpy;

    beforeEach(() => {
      paths = ["defaultTestPath"];
      getStateSubscriptionOverridePathsSpy = jest
        .spyOn(selectors, "getStateSubscriptionOverridePaths")
        .mockReturnValue(["testPathOverride"]);
      triggerPayload = { triggered: true };
      handledPayload = { handled: true };
      stateSubscriptionEpic = stateSubscriptionEpic = (action$, state$) =>
        action$.pipe(
          createStateSubscription(state$, {
            pathSelector: state =>
              selectors.getStateSubscriptionOverridePaths(
                state,
                "testPathOverride"
              )
          }),
          mergeMap(() =>
            createActionStream(
              handleSubscriptionChangeAction({
                testPathOverride: handledPayload
              })
            )
          )
        );
    });

    afterEach(() => {
      getStateSubscriptionOverridePathsSpy.mockRestore();
    });

    test("should trigger for changes to monitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ testPathOverride: triggerPayload })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(1);
      expect(testResult[0].type).toEqual("HANDLE_SUBSCRIPTION_CHANGE_ACTION");
      expect(store.testPathOverride.triggered).toEqual(true);
      expect(store.testPathOverride.handled).toEqual(true);
    });

    test("should not trigger for changes to unmonitored paths in the store", async () => {
      state$ = new StateObservable(stateSubject, store);
      action$ = createActionStream(
        triggerSubscriptionChangeAction({ defaultTestPath: triggerPayload })
      );

      const testResult = await stateSubscriptionEpic(action$, state$)
        .pipe(toArray())
        .toPromise();
      expect(testResult.length).toEqual(0);
      expect(store.testPathOverride).toEqual(undefined);
    });
  });
});
