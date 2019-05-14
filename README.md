# Epic State Subscriptions

Epicly perform actions and side effects when `*.the.paths.you.care.about` change in the Redux store.

If you have not used Redux-Observable epics before, [here's a link](https://redux-observable.js.org/docs/basics/Epics.html) to the documentation.

## Installation

There is an additional peer dependency of `redux-observable@^1.1.x`

```javascript
npm i @nerdwallet/epic-state-subscriptions
```

## Basic Usage

Import the `createStateSubscription` operator and add it to your Epic like any other operator. Pass it the paths that you want to subscribe to in the Redux store and it will transform the action stream into a stream of path changes.

```
import { map } from 'rxjs/operators';
import { createStateSubscription } from '@nerdwallet/epic-state-subscriptions';

const exampleEpic = (action$, state$) =>
  action$.pipe(
    createStateSubscription(state$, {
      paths: ['x.y.z', 'a.b.*', '*.c.d'],
    }),
    map(paths => {
      paths.forEach({ pathPattern, path } => {
        console.log(`path ${path} has been reported to change because of matched pattern ${pathPattern}`);
      });
      return sideEffectAction(changeSet);
    })
  );
```

The path changes are emitted as objects with the structure below:

| Key           | Type   | Description                                                           |
|---------------|--------|-----------------------------------------------------------------------|
| path          | String | The path that changed in the Redux store                              | 
| pathPattern   | String | The state subscription path pattern that triggered the path to change |
| prevState     | Any    | The previous state of the path that changed in the Redux store        |
| nextState     | Any    | The new state of the path that changed in the Redux store             |


In the above example, if path `a.b.c` had changed from `false` to `true` the path object emitted would be `{ prevState: false, nextState: true, path: 'a.b.c', pathPattern: 'a.b.*' }`.

> Note: Since operators do not normally get access to the `state$` stream, it is passed explicitly as the first argument, followed by the configuration options.


## Configuration Options

|Option         | Type          | Required | Default      | Description                                                                        |
|---------------|---------------|----------|--------------|------------------------------------------------------------------------------------|
| key           | String        | false    | Random uuid  | Optional key name to identify the subscription                                                   |
| paths         | Array<String> | false    | [ ]          | The `.` delimited initial paths to watch in the Redux store with support for wildcards such as `store.*.y`   |


## Advanced Subscriptions

As a standard RxJS operator, your epic can chain `createStateSubscription` to support additional use cases like buffering path changes:

```
import { bufferTime, filter, map } from 'rxjs/operators';
import { createStateSubscription } from '@nerdwallet/epic-state-subscriptions';

const exampleEpic (action$, state$) =>
  action$.pipe(
    // Buffer the actions changes since they are frequent
    bufferTime(500),
    // Only emit updates to the state subscription if actions
    // have occurred in the buffer interval
    filter(actions => actions.length > 0),
    createStateSubscription(state$, {
      paths: ['a.b.c'],
    }),
    map(paths => {
      paths.forEach({ prevState, nextState, pathPattern, path } => {
        console.log(`path ${path} has been reported to change because of matched pattern ${pathPattern}`);
      });
      return sideEffectAction(changeSet);
    })
  );
```

## Dynamic State Subscription Paths

If a config will need dynamic state subscription paths as the application runs, there is a provided state subscription reducer and action for overriding the default paths initialized in the config which you can use.

Include the state subscriptions reducer in your `combineReducers` redux configuration:

```
import { stateSubscriptionReducer } from '@nerdwallet/epic-state-subscriptions';
import { combineReducers } from 'redux';

const rootReducer = combineReducers([...reducers, stateSubscriptionReducer]);
```

and then you can dispatch the `overrideStateSubscriptionPaths` action:

```
import { overrideStateSubscriptionPaths } from '@nerdwallet/epic-state-subscriptions';

dispatch(overrideStateSubscriptionPaths({ key: 'exampleKey', paths: ['state.x.y'] });
```

The state subscription key passed in the action should match the key in the `createStateSubscription` config. It automatically will now favour configurations in the reducer at that subscription key over the static initial paths specified in the config.


## FAQs

1. My state subscription just needs to perform side effects and not fire any actions, how do I terminate my Epic?

You can use the `tap` operator to perform side effects and use the `ignoreElements` operator to instruct the stream to not emit elements and fire a termination event:

```
import { ignoreElements, tap } from 'rxjs/operators';
import { createStateSubscription } from 'epic-state-subscriptions';
import { sideEffectAction } from './actions';

const exampleEpic = (action$, state$) =>
  action$.pipe(
    createStateSubscription(state$, {
      paths: ['x.y.z', 'a.b.*', '*.c.d'],
    }),
    tap(paths => {
      paths.forEach({ pathPattern, path } => {
        console.log(`path ${path} has been reported to change because of matched pattern ${pathPattern}`);
      });
    }),
    ignoreElements()
  );
```

2. My state subscription is created dynamically and it is updating incorrectly, what gives?

An operator that is applied to the observable more than once needs to share the same key as the previous iteration to preserve its cache. Specify a `key` in your subscription and it will behave as expected.

```
import { ignoreElements, tap } from 'rxjs/operators';
import { createStateSubscription } from 'epic-state-subscriptions';
import { sideEffectAction } from './actions';

const exampleEpic = (action$, state$) =>
  action$.pipe(
    mergeMap(action => {
      return of(action).pipe(
        createStateSubscription(state$, {
          key: 'dynamicSubscription',
          paths: ['x.y.z', 'a.b.*', '*.c.d'],
        }),
        tap(paths => {
          paths.forEach({ pathPattern, path } => {
          console.log(`path ${path} has been reported to change because of matched pattern ${pathPattern}`);
        }),
        ignoreElements()
      )
    }),
  );
```
