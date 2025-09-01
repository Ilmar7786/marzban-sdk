import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  RemoveNode401,
  RemoveNode403,
  RemoveNode422,
  RemoveNodeMutationResponse,
  RemoveNodePathParams,
} from '../../models/NodeModel/RemoveNode.ts'
import { removeNodeMutationResponseSchema } from '../../schemas/NodeSchema/removeNodeSchema.ts'

function getRemoveNodeUrl(nodeId: RemoveNodePathParams['node_id']) {
  const res = { method: 'DELETE', url: `/api/node/${nodeId}` as const }
  return res
}

/**
 * @description Delete a node and remove it from xray in the background.
 * @summary Remove Node
 * {@link /api/node/:node_id}
 */
export async function removeNode(
  nodeId: RemoveNodePathParams['node_id'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    RemoveNodeMutationResponse,
    ResponseErrorConfig<RemoveNode401 | RemoveNode403 | RemoveNode422>,
    unknown
  >({ method: 'DELETE', url: getRemoveNodeUrl(nodeId).url.toString(), ...requestConfig })
  return removeNodeMutationResponseSchema.parse(res.data)
}
