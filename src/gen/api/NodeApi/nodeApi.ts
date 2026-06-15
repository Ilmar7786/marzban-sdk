import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import { mergeConfig } from '@kubb/plugin-client/clients/axios'

import type {
  AddNode401,
  AddNode403,
  AddNode409,
  AddNode422,
  AddNodeMutationRequest,
  AddNodeMutationResponse,
} from '../../models/NodeModel/AddNode.ts'
import type {
  GetNode401,
  GetNode403,
  GetNode422,
  GetNodePathParams,
  GetNodeQueryResponse,
} from '../../models/NodeModel/GetNode.ts'
import type { GetNodes401, GetNodes403, GetNodesQueryResponse } from '../../models/NodeModel/GetNodes.ts'
import type {
  GetNodeSettings401,
  GetNodeSettings403,
  GetNodeSettingsQueryResponse,
} from '../../models/NodeModel/GetNodeSettings.ts'
import type {
  GetUsage401,
  GetUsage403,
  GetUsage422,
  GetUsageQueryParams,
  GetUsageQueryResponse,
} from '../../models/NodeModel/GetUsage.ts'
import type {
  ModifyNode401,
  ModifyNode403,
  ModifyNode422,
  ModifyNodeMutationRequest,
  ModifyNodeMutationResponse,
  ModifyNodePathParams,
} from '../../models/NodeModel/ModifyNode.ts'
import type {
  ReconnectNode401,
  ReconnectNode403,
  ReconnectNode422,
  ReconnectNodeMutationResponse,
  ReconnectNodePathParams,
} from '../../models/NodeModel/ReconnectNode.ts'
import type {
  RemoveNode401,
  RemoveNode403,
  RemoveNode422,
  RemoveNodeMutationResponse,
  RemoveNodePathParams,
} from '../../models/NodeModel/RemoveNode.ts'
import { addNodeMutationRequestSchema, addNodeMutationResponseSchema } from '../../schemas/NodeSchema/addNodeSchema.ts'
import { getNodeQueryResponseSchema } from '../../schemas/NodeSchema/getNodeSchema.ts'
import { getNodeSettingsQueryResponseSchema } from '../../schemas/NodeSchema/getNodeSettingsSchema.ts'
import { getNodesQueryResponseSchema } from '../../schemas/NodeSchema/getNodesSchema.ts'
import { getUsageQueryResponseSchema } from '../../schemas/NodeSchema/getUsageSchema.ts'
import {
  modifyNodeMutationRequestSchema,
  modifyNodeMutationResponseSchema,
} from '../../schemas/NodeSchema/modifyNodeSchema.ts'
import { reconnectNodeMutationResponseSchema } from '../../schemas/NodeSchema/reconnectNodeSchema.ts'
import { removeNodeMutationResponseSchema } from '../../schemas/NodeSchema/removeNodeSchema.ts'

export class nodeApi {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Retrieve the current node settings, including TLS certificate.
   * @summary Get Node Settings
   * {@link /api/node/settings}
   */
  async getNodeSettings(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      GetNodeSettingsQueryResponse,
      ResponseErrorConfig<GetNodeSettings401 | GetNodeSettings403>,
      unknown
    >({ ...requestConfig, method: 'GET', url: `/api/node/settings` })
    return getNodeSettingsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Add a new node to the database and optionally add it as a host.
   * @summary Add Node
   * {@link /api/node}
   */
  async addNode(
    data: AddNodeMutationRequest,
    config: Partial<RequestConfig<AddNodeMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = addNodeMutationRequestSchema.parse(data)
    const res = await request<
      AddNodeMutationResponse,
      ResponseErrorConfig<AddNode401 | AddNode403 | AddNode409 | AddNode422>,
      AddNodeMutationRequest
    >({ ...requestConfig, method: 'POST', url: `/api/node`, data: requestData })
    return addNodeMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve details of a specific node by its ID.
   * @summary Get Node
   * {@link /api/node/:node_id}
   */
  async getNode(node_id: GetNodePathParams['node_id'], config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetNodeQueryResponse, ResponseErrorConfig<GetNode401 | GetNode403 | GetNode422>, unknown>(
      { ...requestConfig, method: 'GET', url: `/api/node/${node_id}` }
    )
    return getNodeQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Update a node's details. Only accessible to sudo admins.
   * @summary Modify Node
   * {@link /api/node/:node_id}
   */
  async modifyNode(
    node_id: ModifyNodePathParams['node_id'],
    data: ModifyNodeMutationRequest,
    config: Partial<RequestConfig<ModifyNodeMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = modifyNodeMutationRequestSchema.parse(data)
    const res = await request<
      ModifyNodeMutationResponse,
      ResponseErrorConfig<ModifyNode401 | ModifyNode403 | ModifyNode422>,
      ModifyNodeMutationRequest
    >({ ...requestConfig, method: 'PUT', url: `/api/node/${node_id}`, data: requestData })
    return modifyNodeMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Delete a node and remove it from xray in the background.
   * @summary Remove Node
   * {@link /api/node/:node_id}
   */
  async removeNode(
    node_id: RemoveNodePathParams['node_id'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      RemoveNodeMutationResponse,
      ResponseErrorConfig<RemoveNode401 | RemoveNode403 | RemoveNode422>,
      unknown
    >({ ...requestConfig, method: 'DELETE', url: `/api/node/${node_id}` })
    return removeNodeMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve a list of all nodes. Accessible only to sudo admins.
   * @summary Get Nodes
   * {@link /api/nodes}
   */
  async getNodes(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetNodesQueryResponse, ResponseErrorConfig<GetNodes401 | GetNodes403>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/api/nodes`,
    })
    return getNodesQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Trigger a reconnection for the specified node. Only accessible to sudo admins.
   * @summary Reconnect Node
   * {@link /api/node/:node_id/reconnect}
   */
  async reconnectNode(
    node_id: ReconnectNodePathParams['node_id'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      ReconnectNodeMutationResponse,
      ResponseErrorConfig<ReconnectNode401 | ReconnectNode403 | ReconnectNode422>,
      unknown
    >({ ...requestConfig, method: 'POST', url: `/api/node/${node_id}/reconnect` })
    return reconnectNodeMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve usage statistics for nodes within a specified date range.
   * @summary Get Usage
   * {@link /api/nodes/usage}
   */
  async getUsage(params?: GetUsageQueryParams, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      GetUsageQueryResponse,
      ResponseErrorConfig<GetUsage401 | GetUsage403 | GetUsage422>,
      unknown
    >({ ...requestConfig, method: 'GET', url: `/api/nodes/usage`, params })
    return getUsageQueryResponseSchema.parse(res.data)
  }
}
