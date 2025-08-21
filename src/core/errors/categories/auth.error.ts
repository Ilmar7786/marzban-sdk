import { ERROR_CODES } from '../codes'
import { SdkError } from '../sdk.error'

export class AuthError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.AUTH_FAILED, details)
  }
}

export class AuthTokenError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.AUTH_TOKEN_FAILED, details)
  }
}
