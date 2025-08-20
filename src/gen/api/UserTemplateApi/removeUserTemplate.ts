import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  RemoveUserTemplate422,
  RemoveUserTemplateMutationResponse,
  RemoveUserTemplatePathParams,
} from '../../models/UserTemplateModel/RemoveUserTemplate.ts'
import { removeUserTemplateMutationResponseSchema } from '../../schemas/UserTemplateSchema/removeUserTemplateSchema.ts'

function getRemoveUserTemplateUrl(templateId: RemoveUserTemplatePathParams['template_id']) {
  const res = {
    method: 'DELETE',
    url: `/api/user_template/${templateId}` as const,
  }
  return res
}

/**
 * @description Remove a User Template by its ID
 * @summary Remove User Template
 * {@link /api/user_template/:template_id}
 */
export async function removeUserTemplate(
  templateId: RemoveUserTemplatePathParams['template_id'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<RemoveUserTemplateMutationResponse, ResponseErrorConfig<RemoveUserTemplate422>, unknown>({
    method: 'DELETE',
    url: getRemoveUserTemplateUrl(templateId).url.toString(),
    ...requestConfig,
  })
  return removeUserTemplateMutationResponseSchema.parse(res.data)
}
