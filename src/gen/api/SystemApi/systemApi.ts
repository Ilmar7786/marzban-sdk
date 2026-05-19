import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type { GetHosts401, GetHosts403, GetHostsQueryResponse } from '../../models/SystemModel/GetHosts.ts'
import type { GetInbounds401, GetInboundsQueryResponse } from '../../models/SystemModel/GetInbounds.ts'
import type { GetSystemStats401, GetSystemStatsQueryResponse } from '../../models/SystemModel/GetSystemStats.ts'
import type {
  ModifyHosts401,
  ModifyHosts403,
  ModifyHosts422,
  ModifyHostsMutationRequest,
  ModifyHostsMutationResponse,
} from '../../models/SystemModel/ModifyHosts.ts'
import { getHostsQueryResponseSchema } from '../../schemas/SystemSchema/getHostsSchema.ts'
import { getInboundsQueryResponseSchema } from '../../schemas/SystemSchema/getInboundsSchema.ts'
import { getSystemStatsQueryResponseSchema } from '../../schemas/SystemSchema/getSystemStatsSchema.ts'
import {
  modifyHostsMutationRequestSchema,
  modifyHostsMutationResponseSchema,
} from '../../schemas/SystemSchema/modifyHostsSchema.ts'

export class systemApi {
  #client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.#client = config.client || fetch
  }

  /**
   * @description Fetch system stats including memory, CPU, and user metrics.
   * @summary Get System Stats
   * {@link /api/system}
   */
  async getSystemStats(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<GetSystemStatsQueryResponse, ResponseErrorConfig<GetSystemStats401>, unknown>({
      method: 'GET',
      url: `/api/system`,
      ...requestConfig,
    })
    return getSystemStatsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve inbound configurations grouped by protocol.
   * @summary Get Inbounds
   * {@link /api/inbounds}
   */
  async getInbounds(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<GetInboundsQueryResponse, ResponseErrorConfig<GetInbounds401>, unknown>({
      method: 'GET',
      url: `/api/inbounds`,
      ...requestConfig,
    })
    return getInboundsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Get a list of proxy hosts grouped by inbound tag.
   * @summary Get Hosts
   * {@link /api/hosts}
   */
  async getHosts(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<GetHostsQueryResponse, ResponseErrorConfig<GetHosts401 | GetHosts403>, unknown>({
      method: 'GET',
      url: `/api/hosts`,
      ...requestConfig,
    })
    return getHostsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Modify proxy hosts and update the configuration.
   * @summary Modify Hosts
   * {@link /api/hosts}
   */
  async modifyHosts(
    data?: ModifyHostsMutationRequest,
    config: Partial<RequestConfig<ModifyHostsMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = modifyHostsMutationRequestSchema.parse(data)
    const res = await request<
      ModifyHostsMutationResponse,
      ResponseErrorConfig<ModifyHosts401 | ModifyHosts403 | ModifyHosts422>,
      ModifyHostsMutationRequest
    >({ method: 'PUT', url: `/api/hosts`, data: requestData, ...requestConfig })
    return modifyHostsMutationResponseSchema.parse(res.data)
  }
}
