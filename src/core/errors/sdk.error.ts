import { AnyType } from '@/common'

import { FormatCode } from './codes'

export class SdkError extends Error {
  public readonly code: string
  public readonly details?: AnyType

  constructor(options: FormatCode, details?: AnyType) {
    super(options.message)
    this.name = new.target.name
    this.code = options.code
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target)
    }
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
