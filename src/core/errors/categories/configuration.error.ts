import { ERROR_CODES } from '../codes'
import { SdkError } from '../sdk.error'

export class ConfigurationError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.CONFIG_INVALID, details)
  }
}
