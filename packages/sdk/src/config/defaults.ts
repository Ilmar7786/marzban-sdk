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

/**
 * Default number of automatic retries for failed HTTP requests.
 *
 * WS log streaming (`core/ws`) does not use this — it has its own budget
 * (`WS_RECONNECT_BUDGET_MS`) below, since "N attempts" doesn't fit a
 * long-lived connection the way it fits a single request.
 */
export const DEFAULT_RETRIES = 3

/** Base delay (ms) used for exponential backoff between retries. */
export const RETRY_BASE_DELAY_MS = 1000

/** Upper bound (ms) for a single retry backoff delay. */
export const MAX_RETRY_DELAY_MS = 30_000

/** Default interval (seconds) for WebSocket log streaming. */
export const DEFAULT_WS_INTERVAL = 1

/**
 * Bounds (seconds) the Marzban panel itself enforces for the WS log
 * `interval` — it accepts any finite value in this range, including
 * fractional ones, and rejects `> 10` before `websocket.accept()` (see
 * docs/marzban-quirks.md). Validating client-side against these same bounds
 * turns that rejection into a synchronous client error instead of a
 * round-tripped, generic HTTP 403.
 */
export const MIN_WS_INTERVAL = 0
export const MAX_WS_INTERVAL = 10

/**
 * How long a WS handshake may stay in `CONNECTING` before it's treated as a
 * transport drop. Guards against a socket that hangs indefinitely — a
 * black hole on SYN, or a proxy that accepts the TCP connection but never
 * completes the upgrade.
 */
export const WS_CONNECT_TIMEOUT_MS = 10_000

/** Base delay (ms) for the WS reconnect state machine's exponential backoff. */
export const WS_BACKOFF_BASE_MS = 1_000

/** Upper bound (ms) for a single WS reconnect backoff delay. */
export const WS_BACKOFF_MAX_MS = 30_000

/**
 * How long (ms) a WS stream keeps reconnecting after a transport drop before
 * giving up — a time budget rather than an attempt count, so a
 * `docker restart`-scale outage (~10s) is never lost to a low attempt-count
 * default, while an unbounded default wouldn't mask a permanent failure (a
 * revoked admin, a panel that's gone for good).
 */
export const WS_RECONNECT_BUDGET_MS = 600_000

/**
 * How long (ms) a reconnected WS stream must stay open before it's
 * considered stable again, resetting the reconnect budget above. Without
 * this, one long-lived connection that eventually drops would start its next
 * reconnect attempt with a budget already exhausted by earlier flapping.
 */
export const WS_STABLE_AFTER_MS = 30_000

/**
 * Default `LogOptions.replay` mode. The panel seeds every new WS connection
 * from a shared `deque(maxlen=100)` (see docs/marzban-quirks.md), so a
 * reconnect re-delivers up to 100 already-seen lines by default — `'dedup'`
 * suppresses that.
 */
export const DEFAULT_WS_REPLAY = 'dedup'

/**
 * Size of the ring buffer a `'dedup'`/`'skip'` replay filter checks incoming
 * lines against after a reconnect. Larger than the panel's own 100-line
 * buffer above, so a full replay is never partially missed.
 */
export const WS_REPLAY_BUFFER_LINES = 200
