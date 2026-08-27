import { z } from 'zod/v4'

import { DEFAULT_WS_INTERVAL, MAX_WS_INTERVAL, MIN_WS_INTERVAL } from '@/config'
import { WsOptionsError } from '@/core/errors'

export const logIntervalSchema = z.number().min(MIN_WS_INTERVAL).max(MAX_WS_INTERVAL)

/**
 * Validates a `LogOptions.interval` against the same bounds the panel itself
 * enforces, so an out-of-range value fails synchronously instead of
 * round-tripping to a rejected handshake (see docs/marzban-quirks.md).
 */
export const resolveLogInterval = (interval: number = DEFAULT_WS_INTERVAL): number => {
  const { data, success, error } = logIntervalSchema.safeParse(interval)

  if (!success) {
    throw new WsOptionsError(error.issues)
  }

  return data
}
