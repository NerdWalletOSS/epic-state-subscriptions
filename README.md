# redux-observable-state-subscriptions (ROSS)
![Ross from Friends](http://trackingboard1.wpengine.netdna-cdn.com/wp-content/uploads/2017/12/ross-geller.jpg)

Automatically perform a side effect when path `store.x.y.z` changes in the Redux store using RxJS observables.

## Installation

There is an additional peer dependency of `redux-observable@^1.1.x`

```javascript
npm install redux-observable-state-subscriptions
```

## Basic Usage

Create an array of state subscription config objects with the `paths` to watch and the `pathOperator` RxJS operator to execute
on the observable stream of paths that have changed after an action causes reducers to update the Redux store. 

```
import { sideEffectAction } from '
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
import { createStateSubscriptionEpics } from 'redux-observable-state-subscriptions';

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
| pathOperator  | Function      | true     | N/A          | The path operator to transform a stream of path changes to actions or side effects. The stream emits an array of the form `[{ path: ..., pathPattern: ... }]` where each of the objects is a specific path that changed because of the specific matched pattern. |

## Using Stream Operators

State subscriptions can take an advantage of standard RxJS operators to create complex state subscriptions. Here is an example of
a state subscription that buffers and aggregates changes over a fixed interval:

```
import { bufferTime, filter, map } from 'rxjs/operators';
import { sideEffectAction } from '../Actions';

export default [
  {
    key: 'perfTool',
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
import { stateSubscriptionReducer } from 'redux-observable-state-subscriptions';
import { combineReducers } from 'redux';

const rootReducer = combineReducers([...reducers, stateSubscriptionReducer]);
```

and then you can dispatch the `overrideStateSubscriptionPaths` action:

```
dispatch(overrideStateSubscriptionPaths({ stateSubscriptionKey: 'exampleKey', paths: ['state.x.y'] });
```

supplying the key specified in your config and the new paths to watch.

