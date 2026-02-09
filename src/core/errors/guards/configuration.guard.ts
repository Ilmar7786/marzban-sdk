import { ConfigurationError } from '../categories'

export const isConfigurationError = (error: unknown): error is ConfigurationError => {
  return error instanceof ConfigurationError
}
