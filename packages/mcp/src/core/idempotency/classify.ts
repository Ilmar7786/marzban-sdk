import { isHttpError } from 'marzban-sdk'

/**
 * RFC 9110 safe methods. Hardcoded rather than imported: the SDK's own
 * `SAFE_HTTP_METHODS` lives in `core/http`, which is not part of its public
 * barrel, and reaching past the barrel is forbidden (docs/architecture.md).
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Whether a failed call could have changed anything on the panel. */
export type Applicability = 'not-applied' | 'unknown'

/**
 * Decides whether a thrown error leaves the panel provably untouched, or
 * leaves its state genuinely unknown.
 *
 * This is the whole reason the dedup store can be safe: a call that provably
 * did nothing must stay retryable, while a call whose outcome nobody observed
 * must never be retried blindly. Only one shape means "unknown" — an unsafe
 * HTTP method that was dispatched and never answered.
 *
 * Known limitation: `ECONNREFUSED`/`ENOTFOUND` (nothing ever left the host, so
 * provably not applied) land in the `unknown` bucket too, because the
 * transport-level code sits in `HttpError.details` with no public accessor.
 * The cost is a needless "verify state" answer while a panel is unreachable,
 * bounded by the store's TTL — never a wrong answer. Narrowing it needs a
 * small SDK addition (a `transportCode` getter on `HttpError`), tracked
 * separately.
 */
export function classifyFailure(error: unknown): Applicability {
  // A ZodError, ToolError, ConfigurationError or AuthError never represents a
  // dispatched-but-unanswered mutation.
  if (!isHttpError(error)) return 'not-applied'

  // The panel answered, with a 4xx or 5xx: it rejected the request.
  if (error.status !== undefined) return 'not-applied'

  // No method at all means the failure happened before a request was built.
  const method = error.method
  if (method === undefined) return 'not-applied'

  // The request that failed was a read. Destructive handlers read before they
  // write (`config_update` calls `getCoreConfig` first, `hosts_update` calls
  // `getHosts`), so a failure here is a failure of the read, not the write.
  // `HttpError.method` is documented to come back uppercased.
  if (SAFE_METHODS.has(method)) return 'not-applied'

  return 'unknown'
}
