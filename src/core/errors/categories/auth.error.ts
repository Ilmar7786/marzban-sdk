import { ERROR_CODES, FormatCode } from '../codes'
import { SdkError } from '../sdk.error'

export class AuthError extends SdkError {
  constructor(details?: unknown, options: FormatCode = ERROR_CODES.AUTH_FAILED) {
    super(options, details)
  }
}

export class AuthTokenError extends AuthError {
  constructor(details?: unknown) {
    super(details, ERROR_CODES.AUTH_TOKEN_FAILED)
  }
}
