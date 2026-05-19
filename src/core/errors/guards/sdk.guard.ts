import { SdkError } from '../sdk.error'

export const isSdkError = (error: unknown): error is SdkError => {
  return error instanceof SdkError
}
