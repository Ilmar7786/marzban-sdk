import { ConfigurationError } from '../categories'

export const isErrorConfiguration = (error: unknown): error is ConfigurationError => {
  return error instanceof ConfigurationError
}
