import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    // Increase max listeners for scalability
    this.setMaxListeners(100);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public publish(event: string, data: any) {
    console.log(`[EventBus] Publishing event: ${event}`);
    // Use setImmediate to ensure publishing is non-blocking
    setImmediate(() => {
      this.emit(event, data);
    });
  }

  public subscribe(event: string, callback: (data: any) => void) {
    console.log(`[EventBus] Subscribing to event: ${event}`);
    this.on(event, callback);
  }
}

export const eventBus = EventBus.getInstance();
