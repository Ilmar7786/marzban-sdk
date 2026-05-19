import { ConfigurationError } from '../core/errors'
import { Config, configSchema } from './config'

export function validateConfig(config: unknown): Config {
  const { data, success, error } = configSchema.safeParse(config)

  if (!success) {
    throw new ConfigurationError(error.issues)
  }

  return data
}
