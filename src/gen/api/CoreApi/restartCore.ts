import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type { RestartCore401, RestartCore403, RestartCoreMutationResponse } from '../../models/CoreModel/RestartCore.ts'
import { restartCoreMutationResponseSchema } from '../../schemas/CoreSchema/restartCoreSchema.ts'

function getRestartCoreUrl() {
  const res = { method: 'POST', url: `/api/core/restart` as const }
  return res
}

/**
 * @description Restart the core and all connected nodes.
 * @summary Restart Core
 * {@link /api/core/restart}
 */
export async function restartCore(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<RestartCoreMutationResponse, ResponseErrorConfig<RestartCore401 | RestartCore403>, unknown>(
    { method: 'POST', url: getRestartCoreUrl().url.toString(), ...requestConfig }
  )
  return restartCoreMutationResponseSchema.parse(res.data)
}
