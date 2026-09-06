import { isHttpError } from 'marzban-sdk'

/**
 * RFC 9110 safe methods. Hardcoded rather than imported: the SDK's own
 * `SAFE_HTTP_METHODS` lives in `core/http`, which is not part of its public
 * barrel, and reaching past the barrel is forbidden (docs/architecture.md).
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Transport-level codes that prove the request never left the client — the
 * connection was refused, or the host couldn't be resolved at all. Excludes
 * `ETIMEDOUT`/`ECONNABORTED`: a timeout can happen after an in-flight write
 * was already sent, so those stay `unknown`.
 */
const NEVER_DISPATCHED_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'])

/** Whether a failed call could have changed anything on the panel. */
export type Applicability = 'not-applied' | 'unknown'

/**
 * Decides whether a thrown error leaves the panel provably untouched, or
 * leaves its state genuinely unknown.
 *
 * This is the whole reason the dedup store can be safe: a call that provably
 * did nothing must stay retryable, while a call whose outcome nobody observed
 * must never be retried blindly. Only one shape means "unknown" — an unsafe
 * HTTP method that was dispatched, got no transport code ruling that out,
 * and never answered. See ADR-0019.
 */
export function classifyFailure(error: unknown): Applicability {
  // A ZodError, ToolError, ConfigurationError or AuthError never represents a
  // dispatched-but-unanswered mutation.
  if (!isHttpError(error)) return 'not-applied'

  // The panel answered, with a 4xx or 5xx: it rejected the request.
  if (error.status !== undefined) return 'not-applied'

  // The connection was refused, or the host never resolved: nothing ever
  // left the client, whatever method it would have used.
  if (error.transportCode !== undefined && NEVER_DISPATCHED_CODES.has(error.transportCode)) return 'not-applied'

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
