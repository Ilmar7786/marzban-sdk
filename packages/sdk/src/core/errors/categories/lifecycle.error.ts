import { ERROR_CODES } from '../codes'
import { SdkError } from '../sdk.error'

/** Thrown by any SDK operation attempted after `MarzbanSDK.destroy()` has been called. */
export class SdkDestroyedError extends SdkError<{ operation: string }> {
  constructor(operation: string) {
    super(ERROR_CODES.SDK_DESTROYED, { operation })
  }
}
