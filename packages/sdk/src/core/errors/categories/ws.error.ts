import { ERROR_CODES } from '../codes'
import { SdkError } from '../sdk.error'

export class WsOptionsError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.WS_OPTIONS_INVALID, details)
  }
}
