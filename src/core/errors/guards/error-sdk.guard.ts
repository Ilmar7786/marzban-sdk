import { SdkError } from '../sdk.error'

export const isErrorSdk = (error: unknown): error is SdkError => {
  return error instanceof SdkError
}
