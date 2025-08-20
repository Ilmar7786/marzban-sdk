import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetNode401,
  GetNode403,
  GetNode422,
  GetNodePathParams,
  GetNodeQueryResponse,
} from '../../models/NodeModel/GetNode.ts'
import { getNodeQueryResponseSchema } from '../../schemas/NodeSchema/getNodeSchema.ts'

function getGetNodeUrl(nodeId: GetNodePathParams['node_id']) {
  const res = {
    method: 'GET',
    url: `/api/node/${nodeId}` as const,
  }
  return res
}

/**
 * @description Retrieve details of a specific node by its ID.
 * @summary Get Node
 * {@link /api/node/:node_id}
 */
export async function getNode(
  nodeId: GetNodePathParams['node_id'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetNodeQueryResponse, ResponseErrorConfig<GetNode401 | GetNode403 | GetNode422>, unknown>({
    method: 'GET',
    url: getGetNodeUrl(nodeId).url.toString(),
    ...requestConfig,
  })
  return getNodeQueryResponseSchema.parse(res.data)
}
