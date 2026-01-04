import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  AddUserTemplate422,
  AddUserTemplateMutationRequest,
  AddUserTemplateMutationResponse,
} from '../../models/UserTemplateModel/AddUserTemplate.ts'
import {
  addUserTemplateMutationRequestSchema,
  addUserTemplateMutationResponseSchema,
} from '../../schemas/UserTemplateSchema/addUserTemplateSchema.ts'

function getAddUserTemplateUrl() {
  const res = { method: 'POST', url: `/api/user_template` as const }
  return res
}

/**
 * @description Add a new user template- **name** can be up to 64 characters- **data_limit** must be in bytes and larger or equal to 0- **expire_duration** must be in seconds and larger or equat to 0- **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds
 * @summary Add User Template
 * {@link /api/user_template}
 */
export async function addUserTemplate(
  data?: AddUserTemplateMutationRequest,
  config: Partial<RequestConfig<AddUserTemplateMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = addUserTemplateMutationRequestSchema.parse(data)

  const res = await request<
    AddUserTemplateMutationResponse,
    ResponseErrorConfig<AddUserTemplate422>,
    AddUserTemplateMutationRequest
  >({ method: 'POST', url: getAddUserTemplateUrl().url.toString(), data: requestData, ...requestConfig })
  return addUserTemplateMutationResponseSchema.parse(res.data)
}
