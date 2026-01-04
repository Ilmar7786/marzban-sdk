import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  ModifyUserTemplate422,
  ModifyUserTemplateMutationRequest,
  ModifyUserTemplateMutationResponse,
  ModifyUserTemplatePathParams,
} from '../../models/UserTemplateModel/ModifyUserTemplate.ts'
import {
  modifyUserTemplateMutationRequestSchema,
  modifyUserTemplateMutationResponseSchema,
} from '../../schemas/UserTemplateSchema/modifyUserTemplateSchema.ts'

function getModifyUserTemplateUrl(templateId: ModifyUserTemplatePathParams['template_id']) {
  const res = { method: 'PUT', url: `/api/user_template/${templateId}` as const }
  return res
}

/**
 * @description Modify User Template- **name** can be up to 64 characters- **data_limit** must be in bytes and larger or equal to 0- **expire_duration** must be in seconds and larger or equat to 0- **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds
 * @summary Modify User Template
 * {@link /api/user_template/:template_id}
 */
export async function modifyUserTemplate(
  templateId: ModifyUserTemplatePathParams['template_id'],
  data?: ModifyUserTemplateMutationRequest,
  config: Partial<RequestConfig<ModifyUserTemplateMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = modifyUserTemplateMutationRequestSchema.parse(data)

  const res = await request<
    ModifyUserTemplateMutationResponse,
    ResponseErrorConfig<ModifyUserTemplate422>,
    ModifyUserTemplateMutationRequest
  >({ method: 'PUT', url: getModifyUserTemplateUrl(templateId).url.toString(), data: requestData, ...requestConfig })
  return modifyUserTemplateMutationResponseSchema.parse(res.data)
}
