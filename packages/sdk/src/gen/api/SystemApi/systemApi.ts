import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import { mergeConfig } from '@kubb/plugin-client/clients/axios'

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
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Fetch system stats including memory, CPU, and user metrics.
   * @summary Get System Stats
   * {@link /api/system}
   */
  async getSystemStats(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetSystemStatsQueryResponse, ResponseErrorConfig<GetSystemStats401>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/api/system`,
    })
    return getSystemStatsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve inbound configurations grouped by protocol.
   * @summary Get Inbounds
   * {@link /api/inbounds}
   */
  async getInbounds(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetInboundsQueryResponse, ResponseErrorConfig<GetInbounds401>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/api/inbounds`,
    })
    return getInboundsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Get a list of proxy hosts grouped by inbound tag.
   * @summary Get Hosts
   * {@link /api/hosts}
   */
  async getHosts(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetHostsQueryResponse, ResponseErrorConfig<GetHosts401 | GetHosts403>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/api/hosts`,
    })
    return getHostsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Modify proxy hosts and update the configuration.
   * @summary Modify Hosts
   * {@link /api/hosts}
   */
  async modifyHosts(
    data: ModifyHostsMutationRequest,
    config: Partial<RequestConfig<ModifyHostsMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = modifyHostsMutationRequestSchema.parse(data)
    const res = await request<
      ModifyHostsMutationResponse,
      ResponseErrorConfig<ModifyHosts401 | ModifyHosts403 | ModifyHosts422>,
      ModifyHostsMutationRequest
    >({ ...requestConfig, method: 'PUT', url: `/api/hosts`, data: requestData })
    return modifyHostsMutationResponseSchema.parse(res.data)
  }
}
