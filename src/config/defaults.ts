/**
 * Centralized default values and tuning constants for the SDK.
 *
 * Single source of truth: referenced by the config schema and the HTTP/WS
 * layers so behavior stays consistent and is never hardcoded at call sites.
 */

/**
 * Default request timeout in milliseconds.
 *
 * A non-zero default is deliberate: Axios treats `0` as "no timeout" (wait
 * forever), which would let a hung server block every request — and, via the
 * auth request interceptor, the whole client. Callers may still opt into
 * `timeout: 0` explicitly.
 */
export const DEFAULT_TIMEOUT = 30_000

/** Default number of automatic retries for failed requests / WS reconnections. */
export const DEFAULT_RETRIES = 3

/** Base delay (ms) used for exponential backoff between retries. */
export const RETRY_BASE_DELAY_MS = 1000

/** Upper bound (ms) for a single retry backoff delay. */
export const MAX_RETRY_DELAY_MS = 30_000

/** Default interval (seconds) for WebSocket log streaming. */
export const DEFAULT_WS_INTERVAL = 1
