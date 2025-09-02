import { AnyType } from './types'

/**
 * Event map type for defining event names and their payload types
 */
type EventMap = Record<string, AnyType>

/**
 * Listener function type that can be synchronous or asynchronous
 * @template T - Type of the payload received by the listener
 */
type Listener<T = AnyType> = (payload: T) => void | Promise<void>

/**
 * A type-safe event emitter with support for asynchronous listeners
 * @template TEvents - Object defining event names and their payload types
 *
 * Features:
 * - Full TypeScript type safety for events and payloads
 * - Support for both synchronous and asynchronous listeners
 * - Once listeners that automatically remove themselves after execution
 * - Chaining support for method calls
 * - Error resilience (continues execution even if some listeners fail)
 */
export class SafeEventEmitter<TEvents extends EventMap> {
  /**
   * Map storing regular event listeners
   */
  private events: Map<keyof TEvents, Set<Listener<AnyType>>> = new Map()

  /**
   * Map storing one-time event listeners
   */
  private onceEvents: Map<keyof TEvents, Set<Listener<AnyType>>> = new Map()

  /**
   * Registers a listener for the specified event
   * @param event - Name of the event to listen for
   * @param listener - Callback function to execute when event is emitted
   * @returns This instance for method chaining
   */
  on<TEventName extends keyof TEvents>(event: TEventName, listener: Listener<TEvents[TEventName]>): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(listener)

    return this
  }

  /**
   * Registers a one-time listener for the specified event
   * The listener will be automatically removed after being called once
   * @param event - Name of the event to listen for
   * @param listener - Callback function to execute when event is emitted
   * @returns This instance for method chaining
   */
  once<TEventName extends keyof TEvents>(event: TEventName, listener: Listener<TEvents[TEventName]>): this {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set())
    }
    this.onceEvents.get(event)!.add(listener)

    return this
  }

  /**
   * Removes a listener from the specified event
   * @param event - Name of the event to remove the listener from
   * @param listener - Listener function to remove
   * @returns This instance for method chaining
   */
  off<TEventName extends keyof TEvents>(event: TEventName, listener: Listener<TEvents[TEventName]>): this {
    this.events.get(event)?.delete(listener)
    this.onceEvents.get(event)?.delete(listener)

    return this
  }

  /**
   * Emits an event to all registered listeners
   * @param event - Name of the event to emit
   * @param payload - Data to pass to the listeners
   * @returns True if any listeners were called, false otherwise
   */
  emit<TEventName extends keyof TEvents>(event: TEventName, payload: TEvents[TEventName]): boolean {
    const hasRegularListeners = this.events.has(event) && this.events.get(event)!.size > 0
    const hasOnceListeners = this.onceEvents.has(event) && this.onceEvents.get(event)!.size > 0

    // Return false if no listeners are registered for this event
    if (!hasRegularListeners && !hasOnceListeners) {
      return false
    }

    // Process listeners asynchronously without blocking the emit call
    this.processListenersAsync(event, payload)

    return true
  }

  /**
   * Removes all listeners for the specified event or all events
   * @param event - Optional event name to remove listeners from
   * If not provided, removes all listeners for all events
   */
  removeAllListeners<TEventName extends keyof TEvents>(event?: TEventName): void {
    if (event) {
      this.events.delete(event)
      this.onceEvents.delete(event)
    } else {
      this.events.clear()
      this.onceEvents.clear()
    }
  }

  /**
   * Returns the number of listeners registered for the specified event
   * @param event - Name of the event to count listeners for
   * @returns Total number of listeners (both regular and once)
   */
  listenerCount<TEventName extends keyof TEvents>(event: TEventName): number {
    const regularCount = this.events.get(event)?.size || 0
    const onceCount = this.onceEvents.get(event)?.size || 0
    return regularCount + onceCount
  }

  /**
   * Processes all listeners for an event asynchronously
   * Handles both regular and one-time listeners with proper error handling
   * @param event - Name of the event being processed
   * @param payload - Data to pass to the listeners
   */
  private async processListenersAsync<TEventName extends keyof TEvents>(
    event: TEventName,
    payload: TEvents[TEventName]
  ): Promise<void> {
    // Process regular listeners
    const regularListeners = this.events.get(event)
    if (regularListeners && regularListeners.size > 0) {
      const promises: Promise<void>[] = []

      for (const listener of regularListeners) {
        const result = listener(payload)
        if (result instanceof Promise) {
          promises.push(result)
        }
      }

      // Wait for all async listeners to complete, but don't throw on errors
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      }
    }

    // Process one-time listeners and remove them after execution
    const onceListeners = this.onceEvents.get(event)
    if (onceListeners && onceListeners.size > 0) {
      const promises: Promise<void>[] = []
      const listenersToRemove: Listener<AnyType>[] = []

      for (const listener of onceListeners) {
        const result = listener(payload)
        listenersToRemove.push(listener)

        if (result instanceof Promise) {
          promises.push(result)
        }
      }

      // Remove all one-time listeners for this event
      for (const listener of listenersToRemove) {
        onceListeners.delete(listener)
      }

      // Wait for all async once listeners to complete
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      }
    }
  }
}
