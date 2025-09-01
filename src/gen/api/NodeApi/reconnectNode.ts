import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  ReconnectNode401,
  ReconnectNode403,
  ReconnectNode422,
  ReconnectNodeMutationResponse,
  ReconnectNodePathParams,
} from '../../models/NodeModel/ReconnectNode.ts'
import { reconnectNodeMutationResponseSchema } from '../../schemas/NodeSchema/reconnectNodeSchema.ts'

function getReconnectNodeUrl(nodeId: ReconnectNodePathParams['node_id']) {
  const res = { method: 'POST', url: `/api/node/${nodeId}/reconnect` as const }
  return res
}

/**
 * @description Trigger a reconnection for the specified node. Only accessible to sudo admins.
 * @summary Reconnect Node
 * {@link /api/node/:node_id/reconnect}
 */
export async function reconnectNode(
  nodeId: ReconnectNodePathParams['node_id'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ReconnectNodeMutationResponse,
    ResponseErrorConfig<ReconnectNode401 | ReconnectNode403 | ReconnectNode422>,
    unknown
  >({ method: 'POST', url: getReconnectNodeUrl(nodeId).url.toString(), ...requestConfig })
  return reconnectNodeMutationResponseSchema.parse(res.data)
}
