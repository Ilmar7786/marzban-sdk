import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type { GetNodes401, GetNodes403, GetNodesQueryResponse } from '../../models/NodeModel/GetNodes.ts'
import { getNodesQueryResponseSchema } from '../../schemas/NodeSchema/getNodesSchema.ts'

function getGetNodesUrl() {
  const res = {
    method: 'GET',
    url: `/api/nodes` as const,
  }
  return res
}

/**
 * @description Retrieve a list of all nodes. Accessible only to sudo admins.
 * @summary Get Nodes
 * {@link /api/nodes}
 */
export async function getNodes(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetNodesQueryResponse, ResponseErrorConfig<GetNodes401 | GetNodes403>, unknown>({
    method: 'GET',
    url: getGetNodesUrl().url.toString(),
    ...requestConfig,
  })
  return getNodesQueryResponseSchema.parse(res.data)
}
