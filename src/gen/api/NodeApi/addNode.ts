import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  AddNode401,
  AddNode403,
  AddNode409,
  AddNode422,
  AddNodeMutationRequest,
  AddNodeMutationResponse,
} from '../../models/NodeModel/AddNode.ts'
import { addNodeMutationRequestSchema, addNodeMutationResponseSchema } from '../../schemas/NodeSchema/addNodeSchema.ts'

function getAddNodeUrl() {
  const res = { method: 'POST', url: `/api/node` as const }
  return res
}

/**
 * @description Add a new node to the database and optionally add it as a host.
 * @summary Add Node
 * {@link /api/node}
 */
export async function addNode(
  data: AddNodeMutationRequest,
  config: Partial<RequestConfig<AddNodeMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = addNodeMutationRequestSchema.parse(data)

  const res = await request<
    AddNodeMutationResponse,
    ResponseErrorConfig<AddNode401 | AddNode403 | AddNode409 | AddNode422>,
    AddNodeMutationRequest
  >({ method: 'POST', url: getAddNodeUrl().url.toString(), data: requestData, ...requestConfig })
  return addNodeMutationResponseSchema.parse(res.data)
}
