/**
 * Wraps a consumer-supplied callback so a throw from it is caught instead of
 * propagating into the caller's control flow — e.g. an event emitter's
 * dispatch loop, where an uncaught throw would either skip later listeners or
 * (for a callback invoked without anything awaiting it) surface as an
 * unhandled rejection.
 */
export const safeCallback =
  <T>(callback: ((value: T) => void) | undefined, onFailure: (error: unknown) => void) =>
  (value: T): void => {
    try {
      callback?.(value)
    } catch (error) {
      onFailure(error)
    }
  }
