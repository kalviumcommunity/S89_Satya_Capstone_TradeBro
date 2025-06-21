/**
 * Base State class
 * 
 * This is the base class for all states in the application.
 * States represent the state of a bloc at a given time.
 */
class State {
  constructor(type) {
    this.type = type;
  }
}

export default State;
