import { redactSecrets } from '@/common'

import { ERROR_CODES, ErrorCode, FormatCode } from './codes'

export class SdkError<T = unknown> extends Error {
  public readonly code: ErrorCode
  public readonly details?: T

  constructor(options: FormatCode, details?: T) {
    super(options.message)
    this.name = new.target.name
    this.code = options.code as ErrorCode
    // `details` commonly wraps a raw HTTP client error (request config,
    // headers, response body). Redact secret-bearing fields up front so
    // every consumer — toJSON(), a caught error inspected by app code, a
    // logger printing the trace — sees the same safe value.
    this.details = details === undefined ? undefined : (redactSecrets(details) as T)
    Object.setPrototypeOf(this, new.target.prototype)

    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target)
    }
  }

  static fromCode<T = unknown>(code: ErrorCode, details?: T) {
    const entry = Object.values(ERROR_CODES).find(e => e.code === code)
    const format = entry ?? { code, message: code }
    return new SdkError<T>(format, details)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}
