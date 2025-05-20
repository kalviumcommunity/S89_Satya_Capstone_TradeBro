/**
 * Base Event class
 * 
 * This is the base class for all events in the application.
 * Events are used to trigger state changes in blocs.
 */
class Event {
  constructor(type) {
    this.type = type;
  }
}

export default Event;
