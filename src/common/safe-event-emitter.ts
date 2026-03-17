import { AnyType } from './types'

type EventMap = Record<string, AnyType>

// Promise<unknown> instead of Promise<void> allows listeners that return
// a value (e.g. async functions returning Promise<string>) to be accepted.
// We never use the resolved value — only the settled state matters.
type Listener<T = AnyType> = (payload: T) => unknown

/**
 * A type-safe event emitter with support for asynchronous listeners.
 *
 * @template TEvents - Object defining event names and their payload types
 *
 * Features:
 * - Full TypeScript type safety for events and payloads
 * - Support for both synchronous and asynchronous listeners
 * - Once listeners that automatically remove themselves after execution
 * - Chaining support for method calls
 * - Error resilience (all listeners are called even if one throws)
 *
 * Notes:
 * - emit() is fire-and-forget — it does not return a Promise.
 *   Use emitAsync() if you need to await all listeners.
 * - Listener errors are caught and do not affect other listeners,
 *   but they are also silently swallowed. Add an 'error' event to your
 *   TEvents map and emit it from within listeners if you need error handling.
 */
export class SafeEventEmitter<TEvents extends EventMap> {
  private events: Map<keyof TEvents, Set<Listener<AnyType>>> = new Map()

  // FIX (race condition): once listeners are now removed synchronously
  // at the start of emit(), before any async work begins.
  // This guarantees they can never be triggered by a second emit() that
  // arrives while processListenersAsync is still running.
  private onceEvents: Map<keyof TEvents, Set<Listener<AnyType>>> = new Map()

  on<TEventName extends keyof TEvents>(event: TEventName, listener: Listener<TEvents[TEventName]>): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(listener)
    return this
  }

  once<TEventName extends keyof TEvents>(event: TEventName, listener: Listener<TEvents[TEventName]>): this {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set())
    }
    this.onceEvents.get(event)!.add(listener)
    return this
  }

  off<TEventName extends keyof TEvents>(event: TEventName, listener: Listener<TEvents[TEventName]>): this {
    this.events.get(event)?.delete(listener)
    this.onceEvents.get(event)?.delete(listener)
    return this
  }

  emit<TEventName extends keyof TEvents>(event: TEventName, payload: TEvents[TEventName]): boolean {
    const regularListeners = this.events.get(event)
    const onceListeners = this.onceEvents.get(event)

    const hasRegular = (regularListeners?.size ?? 0) > 0
    const hasOnce = (onceListeners?.size ?? 0) > 0

    if (!hasRegular && !hasOnce) {
      return false
    }

    // FIX (race condition): snapshot and clear once listeners synchronously
    // before any async work starts, so a second emit() cannot re-trigger them.
    const onceSnapshot = onceListeners ? new Set(onceListeners) : null
    if (onceListeners) {
      onceListeners.clear()
    }

    this.processListenersAsync(event, payload, onceSnapshot)

    return true
  }

  /**
   * Same as emit() but returns a Promise that resolves when all listeners
   * (both regular and once) have settled. Useful when you need to ensure
   * all async side effects are complete before proceeding.
   */
  async emitAsync<TEventName extends keyof TEvents>(event: TEventName, payload: TEvents[TEventName]): Promise<boolean> {
    const regularListeners = this.events.get(event)
    const onceListeners = this.onceEvents.get(event)

    const hasRegular = (regularListeners?.size ?? 0) > 0
    const hasOnce = (onceListeners?.size ?? 0) > 0

    if (!hasRegular && !hasOnce) {
      return false
    }

    const onceSnapshot = onceListeners ? new Set(onceListeners) : null
    if (onceListeners) {
      onceListeners.clear()
    }

    await this.processListenersAsync(event, payload, onceSnapshot)

    return true
  }

  removeAllListeners<TEventName extends keyof TEvents>(event?: TEventName): void {
    if (event) {
      this.events.delete(event)
      this.onceEvents.delete(event)
    } else {
      this.events.clear()
      this.onceEvents.clear()
    }
  }

  listenerCount<TEventName extends keyof TEvents>(event: TEventName): number {
    const regularCount = this.events.get(event)?.size ?? 0
    const onceCount = this.onceEvents.get(event)?.size ?? 0
    return regularCount + onceCount
  }

  // FIX (sync throw breaks chain): each listener is now wrapped in a
  // Promise.resolve().then() so that both sync throws and async rejections
  // are uniformly converted to rejected Promises before being passed to
  // Promise.allSettled — which guarantees every listener runs regardless
  // of what the previous one did.
  private async processListenersAsync<TEventName extends keyof TEvents>(
    event: TEventName,
    payload: TEvents[TEventName],
    onceSnapshot: Set<Listener<AnyType>> | null
  ): Promise<void> {
    const promises: Promise<unknown>[] = []

    const regularListeners = this.events.get(event)
    if (regularListeners && regularListeners.size > 0) {
      for (const listener of regularListeners) {
        promises.push(Promise.resolve().then(() => listener(payload)))
      }
    }

    if (onceSnapshot && onceSnapshot.size > 0) {
      for (const listener of onceSnapshot) {
        promises.push(Promise.resolve().then(() => listener(payload)))
      }
    }

    await Promise.allSettled(promises)
  }
}
