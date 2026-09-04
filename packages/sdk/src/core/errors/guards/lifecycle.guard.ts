import { SdkDestroyedError } from '../categories'

export const isSdkDestroyedError = (error: unknown): error is SdkDestroyedError => {
  return error instanceof SdkDestroyedError
}
