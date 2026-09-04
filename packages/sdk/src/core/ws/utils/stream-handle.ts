/**
 * A logical stream's public handle: callable (closes it, for source
 * compatibility with the bare close function this replaces), with an
 * explicit `close()` and a live `state`.
 */
export type StreamHandle<S> = {
  (): void
  close(): void
  readonly state: S
}

/** Anything a {@link StreamHandle} can wrap — matches `LogStream` structurally. */
export interface StreamHandleSource<S> {
  close(): void
  readonly state: S
}

/**
 * Wraps `source` in a {@link StreamHandle}.
 *
 * `state` must be a live getter, not a snapshot — `Object.assign` would copy
 * the *value* at creation time, freezing `handle.state` at whatever `source`
 * reported the moment this ran. `Object.defineProperty` with a getter reads
 * `source.state` on every access instead.
 */
export const createStreamHandle = <S>(source: StreamHandleSource<S>): StreamHandle<S> => {
  const handle = (() => source.close()) as StreamHandle<S>
  handle.close = () => source.close()
  Object.defineProperty(handle, 'state', { get: () => source.state, enumerable: true })
  return handle
}
