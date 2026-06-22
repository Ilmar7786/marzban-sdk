import { ConfigurationError } from '../core/errors'
import { configSchema, ValidatedConfig } from './config'

export function validateConfig(config: unknown): ValidatedConfig {
  const { data, success, error } = configSchema.safeParse(config)

  if (!success) {
    throw new ConfigurationError(error.issues)
  }

  return data
}
