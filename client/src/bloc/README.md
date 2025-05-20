# Bloc Architecture Pattern

This directory contains the implementation of the Bloc (Business Logic Component) pattern for the TradeBro application.

## What is the Bloc Pattern?

The Bloc pattern is a design pattern that helps separate business logic from the presentation layer. It's similar to other state management patterns like Redux, but with a more event-driven approach.

## Key Components

### 1. Bloc

A Bloc (Business Logic Component) is responsible for converting events into states. It receives events, processes them, and emits new states.

### 2. Event

Events are the input to a Bloc. They represent something that has happened in the application, such as a user action or a system event.

### 3. State

States are the output of a Bloc. They represent the state of the application at a given time.

### 4. Repository

Repositories are responsible for data access. They abstract the data source from the Bloc.

### 5. Model

Models represent the data entities in the application.

## Directory Structure

```
bloc/
├── blocs/           # Contains all bloc classes
├── events/          # Contains events that trigger bloc state changes
├── states/          # Contains state classes for blocs
├── repositories/    # Contains repository classes for data access
├── models/          # Contains data models
├── Bloc.js          # Base Bloc class
├── Event.js         # Base Event class
├── State.js         # Base State class
├── BlocProvider.jsx # Provides blocs to the component tree
├── BlocBuilder.jsx  # Builds UI based on bloc states
└── index.js         # Exports all bloc components
```

## How to Use

### 1. Create a Bloc

```javascript
import Bloc from '../Bloc';
import { SomeEvent } from '../events/SomeEvents';
import { SomeState } from '../states/SomeStates';

class SomeBloc extends Bloc {
  constructor() {
    super(new SomeInitialState());
  }

  async mapEventToState(event) {
    if (event instanceof SomeEvent) {
      // Handle the event and emit a new state
      this.emit(new SomeState());
    }
  }
}
```

### 2. Create Events

```javascript
import Event from '../Event';

export class SomeEvent extends Event {
  constructor(data) {
    super('SOME_EVENT');
    this.data = data;
  }
}
```

### 3. Create States

```javascript
import State from '../State';

export class SomeState extends State {
  constructor(data) {
    super('SOME_STATE');
    this.data = data;
  }
}
```

### 4. Provide Blocs to Components

```jsx
import { BlocProvider } from './bloc/BlocProvider';
import SomeBloc from './bloc/blocs/SomeBloc';

const someBloc = new SomeBloc();

const App = () => {
  return (
    <BlocProvider blocs={{ some: someBloc }}>
      <YourComponent />
    </BlocProvider>
  );
};
```

### 5. Use Blocs in Components

```jsx
import { useBloc } from './bloc/BlocProvider';
import BlocBuilder from './bloc/BlocBuilder';
import { SomeEvent } from './bloc/events/SomeEvents';
import { SomeState } from './bloc/states/SomeStates';

const YourComponent = () => {
  const someBloc = useBloc('some');

  const handleSomething = () => {
    someBloc.add(new SomeEvent('data'));
  };

  return (
    <div>
      <button onClick={handleSomething}>Do Something</button>
      <BlocBuilder
        bloc={someBloc}
        builder={(state) => {
          if (state instanceof SomeState) {
            return <div>{state.data}</div>;
          }
          return <div>Loading...</div>;
        }}
      />
    </div>
  );
};
```

## Benefits of the Bloc Pattern

1. **Separation of Concerns**: Business logic is separated from the presentation layer.
2. **Testability**: Blocs are easy to test because they don't depend on the UI.
3. **Reusability**: Blocs can be reused across different components.
4. **Predictability**: The state flow is predictable and easy to debug.
5. **Maintainability**: The codebase is more maintainable because of the clear separation of concerns.

## Migration Strategy

We're gradually migrating from Redux to the Bloc pattern. During the transition, we'll maintain both patterns to ensure backward compatibility.

1. Create new features using the Bloc pattern.
2. Refactor existing features to use the Bloc pattern when making significant changes.
3. Eventually, remove Redux once all features have been migrated.
