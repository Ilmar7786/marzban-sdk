import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import { mergeConfig } from '@kubb/plugin-client/clients/axios'

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
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Add a new user template
   * - **name** can be up to 64 characters
   * - **data_limit** must be in bytes and larger or equal to 0
   * - **expire_duration** must be in seconds and larger or equat to 0
   * - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds
   * @summary Add User Template
   * {@link /api/user_template}
   */
  async addUserTemplate(
    data: AddUserTemplateMutationRequest,
    config: Partial<RequestConfig<AddUserTemplateMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = addUserTemplateMutationRequestSchema.parse(data)
    const res = await request<
      AddUserTemplateMutationResponse,
      ResponseErrorConfig<AddUserTemplate422>,
      AddUserTemplateMutationRequest
    >({ ...requestConfig, method: 'POST', url: `/api/user_template`, data: requestData })
    return addUserTemplateMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get a list of User Templates with optional pagination
   * @summary Get User Templates
   * {@link /api/user_template}
   */
  async getUserTemplates(
    params?: GetUserTemplatesQueryParams,
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetUserTemplatesQueryResponse, ResponseErrorConfig<GetUserTemplates422>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/api/user_template`,
      params,
    })
    return getUserTemplatesQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Get User Template information with id
   * @summary Get User Template Endpoint
   * {@link /api/user_template/:template_id}
   */
  async getUserTemplateEndpoint(
    template_id: GetUserTemplateEndpointPathParams['template_id'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      GetUserTemplateEndpointQueryResponse,
      ResponseErrorConfig<GetUserTemplateEndpoint422>,
      unknown
    >({ ...requestConfig, method: 'GET', url: `/api/user_template/${template_id}` })
    return getUserTemplateEndpointQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Modify User Template
   * - **name** can be up to 64 characters
   * - **data_limit** must be in bytes and larger or equal to 0
   * - **expire_duration** must be in seconds and larger or equat to 0
   * - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds
   * @summary Modify User Template
   * {@link /api/user_template/:template_id}
   */
  async modifyUserTemplate(
    template_id: ModifyUserTemplatePathParams['template_id'],
    data: ModifyUserTemplateMutationRequest,
    config: Partial<RequestConfig<ModifyUserTemplateMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = modifyUserTemplateMutationRequestSchema.parse(data)
    const res = await request<
      ModifyUserTemplateMutationResponse,
      ResponseErrorConfig<ModifyUserTemplate422>,
      ModifyUserTemplateMutationRequest
    >({ ...requestConfig, method: 'PUT', url: `/api/user_template/${template_id}`, data: requestData })
    return modifyUserTemplateMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Remove a User Template by its ID
   * @summary Remove User Template
   * {@link /api/user_template/:template_id}
   */
  async removeUserTemplate(
    template_id: RemoveUserTemplatePathParams['template_id'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<RemoveUserTemplateMutationResponse, ResponseErrorConfig<RemoveUserTemplate422>, unknown>({
      ...requestConfig,
      method: 'DELETE',
      url: `/api/user_template/${template_id}`,
    })
    return removeUserTemplateMutationResponseSchema.parse(res.data)
  }
}
