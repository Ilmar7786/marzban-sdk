import { ERROR_CODES } from '../codes'
import { SdkError } from '../sdk.error'

export class HttpError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.NETWORK_HTTP_ERROR, details)
  }
}
