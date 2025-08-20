import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetUserTemplateEndpoint422,
  GetUserTemplateEndpointPathParams,
  GetUserTemplateEndpointQueryResponse,
} from '../../models/UserTemplateModel/GetUserTemplateEndpoint.ts'
import { getUserTemplateEndpointQueryResponseSchema } from '../../schemas/UserTemplateSchema/getUserTemplateEndpointSchema.ts'

function getGetUserTemplateEndpointUrl(templateId: GetUserTemplateEndpointPathParams['template_id']) {
  const res = {
    method: 'GET',
    url: `/api/user_template/${templateId}` as const,
  }
  return res
}

/**
 * @description Get User Template information with id
 * @summary Get User Template Endpoint
 * {@link /api/user_template/:template_id}
 */
export async function getUserTemplateEndpoint(
  templateId: GetUserTemplateEndpointPathParams['template_id'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetUserTemplateEndpointQueryResponse,
    ResponseErrorConfig<GetUserTemplateEndpoint422>,
    unknown
  >({
    method: 'GET',
    url: getGetUserTemplateEndpointUrl(templateId).url.toString(),
    ...requestConfig,
  })
  return getUserTemplateEndpointQueryResponseSchema.parse(res.data)
}
