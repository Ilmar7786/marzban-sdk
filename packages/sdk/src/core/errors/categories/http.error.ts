import { ERROR_CODES } from '../codes'
import { SdkError } from '../sdk.error'

// `details` on a real HttpError is usually an Axios error (redacted, but
// otherwise shaped as-is) — `response.status`/`response.statusText`/
// `response.data` and `config.method`/`config.url` are its conventional
// homes. Duck-typed rather than asserted: a caller can construct
// `new HttpError('some string')` (see auth.interceptors.ts's
// "no access token after re-authentication" case), so `details` isn't
// guaranteed to have this shape at all.
function property(source: unknown, key: string): unknown {
  if (!source || typeof source !== 'object') return undefined
  return (source as Record<string, unknown>)[key]
}

export class HttpError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.NETWORK_HTTP_ERROR, details)
  }

  /** HTTP status code of the failed request's response. `undefined` when there was no response at all (e.g. a network-level failure, a timeout). */
  get status(): number | undefined {
    const value = property(property(this.details, 'response'), 'status')
    return typeof value === 'number' ? value : undefined
  }

  /** HTTP status text (e.g. `"Not Found"`), when available. */
  get statusText(): string | undefined {
    const value = property(property(this.details, 'response'), 'statusText')
    return typeof value === 'string' ? value : undefined
  }

  /** The response body of the failed request, when available. */
  get data(): unknown {
    return property(property(this.details, 'response'), 'data')
  }

  /** HTTP method of the failed request (e.g. `"GET"`), when available. */
  get method(): string | undefined {
    const value = property(property(this.details, 'config'), 'method')
    return typeof value === 'string' ? value.toUpperCase() : undefined
  }

  /** URL of the failed request, when available. */
  get url(): string | undefined {
    const value = property(property(this.details, 'config'), 'url')
    return typeof value === 'string' ? value : undefined
  }
}
