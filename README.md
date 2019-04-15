# Epic State Subscriptions

Epicly perform actions and side effects when paths like `store.x.y.z` changes in the Redux store using Redux-Observable.

## Installation

There is an additional peer dependency of `redux-observable@^1.1.x`

```javascript
npm install epic-state-subscriptions
```

## Basic Usage

Create an array of state subscription config objects with the `paths` to watch and the `pathOperator` RxJS operator to execute
on the observable stream of paths that have changed after an action causes reducers to update the Redux store. 

```
import { sideEffectAction } from '../Actions';
const stateSubscriptionConfigs = [
  {
    paths: ['state.x.*.y'],
    pathOperator: (paths$, state$) =>
      paths$.pipe(
        tap(paths => {
          paths.forEach({ pathPattern, path } => {
            console.log(`path ${path} has been reported to change because of matched pattern ${pathPattern}`);
          });
          return sideEffectAction(changeSet);
        })
      ),
  },
];
```

Then supply the config to the `createStateSubscriptionEpics` epic generator method which creates an array of epics to be included
in your Redux-Observable `combineEpics` method alongside your other epics. If you are unfamiliar with Epics, read about them [here](https://redux-observable.js.org/docs/basics/Epics.html).

```
import { createStateSubscriptionEpics } from 'epic-state-subscriptions';

const rootEpic = combineEpics(
  yourEpic,
  ...createStateSubscriptionEpics(stateSubscriptionConfigs)
);
```

Done! Now fire an action that will update your redux state at one of your subscribed paths and watch the path operators perform your side effects!

## Configuration API

State subscription configurations have the following API:

|Option         | Type          | Required | Default      | Description                                                                        |
|---------------|---------------|----------|--------------|------------------------------------------------------------------------------------|
| key           | String        | false    | Random uuid  | Optional key name for the config                                                   |
| paths         | Array<String> | false    | [ ]          | The paths of the form `store.path1.path2` with support for wildcards `store.*.y`   |
| pathOperator  | Function      | true     | N/A          | The path operator to transform a stream of path changes to actions or side effects. The stream emits an array of the form `[{ path: ..., pathPattern: ... }]` where each of the path objects consists of the path that changed and the pattern it matched. |

## Using Stream Operators

State subscriptions can take an advantage of standard RxJS operators to create complex state subscriptions. Here is an example of
a state subscription that buffers and aggregates changes over a fixed interval:

```
import { bufferTime, filter, map } from 'rxjs/operators';
import { sideEffectAction } from '../Actions';

export default [
  {
    key: 'exampleKey',
    paths: [],
    pathOperator: (paths$, state$) =>
      paths$.pipe(
        // Buffer the handling of path changes
        bufferTime(1000),
        // Only proceed if there have been paths that have changed after the buffer interval
        filter(pathSets => pathSets.length > 0),
        // Flatten out the sets of path changes and make them distinct
        map(pathSets =>
          _.uniqBy(_.flatten(pathSets), ({ path }) => path)
        ),
        // Perform a side effect on each of our buffered paths
        map(paths => sideEffectAction())
      ),
  },
];
```

## Dynamic State Subscription Paths

If a config will need dynamic state subscription paths as the application runs, there is a provided state subscription reducer and action for
overriding the default paths initialized in the config.

Include the state subscriptions reducer in your `combineReducers` redux configuration:

```
import { stateSubscriptionReducer } from 'epic-state-subscriptions';
import { combineReducers } from 'redux';

const rootReducer = combineReducers([...reducers, stateSubscriptionReducer]);
```

and then you can dispatch the `overrideStateSubscriptionPaths` action:

```
import { overrideStateSubscriptionPaths } from 'epic-state-subscriptions';

dispatch(overrideStateSubscriptionPaths({ stateSubscriptionKey: 'exampleKey', paths: ['state.x.y'] });
```

supplying the key specified in your config and the new paths to watch.

## FAQs

1. My state subscription just needs to perform side effects and not fire any actions, how do I set up my `pathOperator`?

You can use the `tap` operator to perform side effects and use the `ignoreElements` operator to instruct the stream to not emit elements and fire a termination event:

```
import { ignoreElements, tap } from 'rxjs/operators';
import { sideEffect } from '../utils';

export default [
  {
    paths: [],
    pathOperator: (paths$, state$) =>
      paths$.pipe(
        tap(paths => sideEffect(paths)),
        ignoreElements(),
      ),
  },
];
```
