import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  AddUserTemplate422,
  AddUserTemplateMutationRequest,
  AddUserTemplateMutationResponse,
} from '../../models/UserTemplateModel/AddUserTemplate.ts'
import type {
  GetUserTemplateEndpoint422,
  GetUserTemplateEndpointPathParams,
  GetUserTemplateEndpointQueryResponse,
} from '../../models/UserTemplateModel/GetUserTemplateEndpoint.ts'
import type {
  GetUserTemplates422,
  GetUserTemplatesQueryParams,
  GetUserTemplatesQueryResponse,
} from '../../models/UserTemplateModel/GetUserTemplates.ts'
import type {
  ModifyUserTemplate422,
  ModifyUserTemplateMutationRequest,
  ModifyUserTemplateMutationResponse,
  ModifyUserTemplatePathParams,
} from '../../models/UserTemplateModel/ModifyUserTemplate.ts'
import type {
  RemoveUserTemplate422,
  RemoveUserTemplateMutationResponse,
  RemoveUserTemplatePathParams,
} from '../../models/UserTemplateModel/RemoveUserTemplate.ts'
import {
  addUserTemplateMutationRequestSchema,
  addUserTemplateMutationResponseSchema,
} from '../../schemas/UserTemplateSchema/addUserTemplateSchema.ts'
import { getUserTemplateEndpointQueryResponseSchema } from '../../schemas/UserTemplateSchema/getUserTemplateEndpointSchema.ts'
import { getUserTemplatesQueryResponseSchema } from '../../schemas/UserTemplateSchema/getUserTemplatesSchema.ts'
import {
  modifyUserTemplateMutationRequestSchema,
  modifyUserTemplateMutationResponseSchema,
} from '../../schemas/UserTemplateSchema/modifyUserTemplateSchema.ts'
import { removeUserTemplateMutationResponseSchema } from '../../schemas/UserTemplateSchema/removeUserTemplateSchema.ts'

export class userTemplateApi {
  #client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.#client = config.client || fetch
  }

  /**
   * @description Add a new user template- **name** can be up to 64 characters- **data_limit** must be in bytes and larger or equal to 0- **expire_duration** must be in seconds and larger or equat to 0- **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds
   * @summary Add User Template
   * {@link /api/user_template}
   */
  async addUserTemplate(
    data?: AddUserTemplateMutationRequest,
    config: Partial<RequestConfig<AddUserTemplateMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = addUserTemplateMutationRequestSchema.parse(data)
    const res = await request<
      AddUserTemplateMutationResponse,
      ResponseErrorConfig<AddUserTemplate422>,
      AddUserTemplateMutationRequest
    >({ method: 'POST', url: `/api/user_template`, data: requestData, ...requestConfig })
    return addUserTemplateMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get a list of User Templates with optional pagination
   * @summary Get User Templates
   * {@link /api/user_template}
   */
  async getUserTemplates(
    params?: GetUserTemplatesQueryParams,
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<GetUserTemplatesQueryResponse, ResponseErrorConfig<GetUserTemplates422>, unknown>({
      method: 'GET',
      url: `/api/user_template`,
      params,
      ...requestConfig,
    })
    return getUserTemplatesQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Get User Template information with id
   * @summary Get User Template Endpoint
   * {@link /api/user_template/:template_id}
   */
  async getUserTemplateEndpoint(
    templateId: GetUserTemplateEndpointPathParams['template_id'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetUserTemplateEndpointQueryResponse,
      ResponseErrorConfig<GetUserTemplateEndpoint422>,
      unknown
    >({ method: 'GET', url: `/api/user_template/${templateId}`, ...requestConfig })
    return getUserTemplateEndpointQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Modify User Template- **name** can be up to 64 characters- **data_limit** must be in bytes and larger or equal to 0- **expire_duration** must be in seconds and larger or equat to 0- **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds
   * @summary Modify User Template
   * {@link /api/user_template/:template_id}
   */
  async modifyUserTemplate(
    templateId: ModifyUserTemplatePathParams['template_id'],
    data?: ModifyUserTemplateMutationRequest,
    config: Partial<RequestConfig<ModifyUserTemplateMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = modifyUserTemplateMutationRequestSchema.parse(data)
    const res = await request<
      ModifyUserTemplateMutationResponse,
      ResponseErrorConfig<ModifyUserTemplate422>,
      ModifyUserTemplateMutationRequest
    >({ method: 'PUT', url: `/api/user_template/${templateId}`, data: requestData, ...requestConfig })
    return modifyUserTemplateMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Remove a User Template by its ID
   * @summary Remove User Template
   * {@link /api/user_template/:template_id}
   */
  async removeUserTemplate(
    templateId: RemoveUserTemplatePathParams['template_id'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<RemoveUserTemplateMutationResponse, ResponseErrorConfig<RemoveUserTemplate422>, unknown>({
      method: 'DELETE',
      url: `/api/user_template/${templateId}`,
      ...requestConfig,
    })
    return removeUserTemplateMutationResponseSchema.parse(res.data)
  }
}
