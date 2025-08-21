/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormatCode } from './codes'

export abstract class SdkError extends Error {
  public readonly code: string
  public readonly details?: any

  constructor(options: FormatCode, details?: any) {
    super(options.message)
    this.name = new.target.name
    this.code = options.code
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
