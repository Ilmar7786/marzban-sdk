import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  GetCoreConfig401,
  GetCoreConfig403,
  GetCoreConfigQueryResponse,
} from '../../models/CoreModel/GetCoreConfig.ts'
import type { GetCoreStats401, GetCoreStatsQueryResponse } from '../../models/CoreModel/GetCoreStats.ts'
import type {
  ModifyCoreConfig401,
  ModifyCoreConfig403,
  ModifyCoreConfig422,
  ModifyCoreConfigMutationRequest,
  ModifyCoreConfigMutationResponse,
} from '../../models/CoreModel/ModifyCoreConfig.ts'
import type { RestartCore401, RestartCore403, RestartCoreMutationResponse } from '../../models/CoreModel/RestartCore.ts'
import { getCoreConfigQueryResponseSchema } from '../../schemas/CoreSchema/getCoreConfigSchema.ts'
import { getCoreStatsQueryResponseSchema } from '../../schemas/CoreSchema/getCoreStatsSchema.ts'
import {
  modifyCoreConfigMutationRequestSchema,
  modifyCoreConfigMutationResponseSchema,
} from '../../schemas/CoreSchema/modifyCoreConfigSchema.ts'
import { restartCoreMutationResponseSchema } from '../../schemas/CoreSchema/restartCoreSchema.ts'

export class coreApi {
  #client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.#client = config.client || fetch
  }

  /**
   * @description Retrieve core statistics such as version and uptime.
   * @summary Get Core Stats
   * {@link /api/core}
   */
  async getCoreStats(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<GetCoreStatsQueryResponse, ResponseErrorConfig<GetCoreStats401>, unknown>({
      method: 'GET',
      url: `/api/core`,
      ...requestConfig,
    })
    return getCoreStatsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Restart the core and all connected nodes.
   * @summary Restart Core
   * {@link /api/core/restart}
   */
  async restartCore(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      RestartCoreMutationResponse,
      ResponseErrorConfig<RestartCore401 | RestartCore403>,
      unknown
    >({ method: 'POST', url: `/api/core/restart`, ...requestConfig })
    return restartCoreMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get the current core configuration.
   * @summary Get Core Config
   * {@link /api/core/config}
   */
  async getCoreConfig(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetCoreConfigQueryResponse,
      ResponseErrorConfig<GetCoreConfig401 | GetCoreConfig403>,
      unknown
    >({ method: 'GET', url: `/api/core/config`, ...requestConfig })
    return getCoreConfigQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Modify the core configuration and restart the core.
   * @summary Modify Core Config
   * {@link /api/core/config}
   */
  async modifyCoreConfig(
    data?: ModifyCoreConfigMutationRequest,
    config: Partial<RequestConfig<ModifyCoreConfigMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = modifyCoreConfigMutationRequestSchema.parse(data)
    const res = await request<
      ModifyCoreConfigMutationResponse,
      ResponseErrorConfig<ModifyCoreConfig401 | ModifyCoreConfig403 | ModifyCoreConfig422>,
      ModifyCoreConfigMutationRequest
    >({ method: 'PUT', url: `/api/core/config`, data: requestData, ...requestConfig })
    return modifyCoreConfigMutationResponseSchema.parse(res.data)
  }
}
