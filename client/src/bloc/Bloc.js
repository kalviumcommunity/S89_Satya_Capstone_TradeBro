/**
 * Base Bloc class
 * 
 * This is the base class for all blocs in the application.
 * A bloc (Business Logic Component) is responsible for converting events into states.
 */
import { EventEmitter } from 'events';

class Bloc extends EventEmitter {
  constructor(initialState) {
    super();
    this._state = initialState;
  }

  /**
   * Get the current state of the bloc
   */
  get state() {
    return this._state;
  }

  /**
   * Emit a new state
   * @param {Object} state - The new state
   */
  emit(state) {
    this._state = state;
    super.emit('state', state);
  }

  /**
   * Add a listener for state changes
   * @param {Function} listener - The listener function
   */
  addListener(listener) {
    super.addListener('state', listener);
    // Immediately call the listener with the current state
    listener(this._state);
    
    // Return a function to remove the listener
    return () => {
      super.removeListener('state', listener);
    };
  }

  /**
   * Handle an event
   * This method should be overridden by subclasses
   * @param {Object} event - The event to handle
   */
  mapEventToState(event) {
    throw new Error('mapEventToState must be implemented by subclasses');
  }

  /**
   * Add an event to the bloc
   * @param {Object} event - The event to add
   */
  add(event) {
    this.mapEventToState(event);
  }

  /**
   * Dispose of the bloc
   * This method should be called when the bloc is no longer needed
   */
  dispose() {
    this.removeAllListeners();
  }
}

export default Bloc;
