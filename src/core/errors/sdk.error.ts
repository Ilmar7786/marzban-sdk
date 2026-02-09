import { ERROR_CODES, ErrorCode, FormatCode } from './codes'

// todo: проверить
export class SdkError<T = unknown> extends Error {
  public readonly code: ErrorCode
  public readonly details?: T

  constructor(options: FormatCode, details?: T) {
    super(options.message)
    this.name = new.target.name
    this.code = options.code as ErrorCode
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)

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
