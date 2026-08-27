import { AxiosError } from 'axios'
import axiosRetry from 'axios-retry'

export const SAFE_HTTP_METHODS = ['get', 'head', 'options'] as const

/** Login is the one POST safe to replay: it's stateless, re-issuing a token has no side effects. */
export const LOGIN_RETRYABLE_METHODS = [...SAFE_HTTP_METHODS, 'post'] as const

/**
 * Unlike axios-retry's default (`isNetworkOrIdempotentRequestError`), the
 * method check runs first and gates everything else — a network error on a
 * disallowed method is never retried.
 */
export const createRetryCondition = (retryableMethods: readonly string[]) => {
  const allowed = new Set(retryableMethods)

  return (error: AxiosError): boolean => {
    const method = error.config?.method?.toLowerCase()
    if (!method || !allowed.has(method)) return false

    const status = error.response?.status
    if (status !== undefined) return status === 429 || (status >= 500 && status <= 599)

    // No response: a genuine network failure. Reuse axios-retry's own check
    // (excludes ERR_CANCELED/ECONNABORTED) rather than axiosRetry.isSafeRequestError,
    // which would retry a cancelled request via AbortSignal.
    return axiosRetry.isNetworkError(error)
  }
}
