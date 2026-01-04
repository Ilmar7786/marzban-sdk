import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  ModifyNode401,
  ModifyNode403,
  ModifyNode422,
  ModifyNodeMutationRequest,
  ModifyNodeMutationResponse,
  ModifyNodePathParams,
} from '../../models/NodeModel/ModifyNode.ts'
import {
  modifyNodeMutationRequestSchema,
  modifyNodeMutationResponseSchema,
} from '../../schemas/NodeSchema/modifyNodeSchema.ts'

function getModifyNodeUrl(nodeId: ModifyNodePathParams['node_id']) {
  const res = { method: 'PUT', url: `/api/node/${nodeId}` as const }
  return res
}

/**
 * @description Update a node's details. Only accessible to sudo admins.
 * @summary Modify Node
 * {@link /api/node/:node_id}
 */
export async function modifyNode(
  nodeId: ModifyNodePathParams['node_id'],
  data?: ModifyNodeMutationRequest,
  config: Partial<RequestConfig<ModifyNodeMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = modifyNodeMutationRequestSchema.parse(data)

  const res = await request<
    ModifyNodeMutationResponse,
    ResponseErrorConfig<ModifyNode401 | ModifyNode403 | ModifyNode422>,
    ModifyNodeMutationRequest
  >({ method: 'PUT', url: getModifyNodeUrl(nodeId).url.toString(), data: requestData, ...requestConfig })
  return modifyNodeMutationResponseSchema.parse(res.data)
}
