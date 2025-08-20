import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetUserTemplates422,
  GetUserTemplatesQueryParams,
  GetUserTemplatesQueryResponse,
} from '../../models/UserTemplateModel/GetUserTemplates.ts'
import { getUserTemplatesQueryResponseSchema } from '../../schemas/UserTemplateSchema/getUserTemplatesSchema.ts'

function getGetUserTemplatesUrl() {
  const res = {
    method: 'GET',
    url: `/api/user_template` as const,
  }
  return res
}

/**
 * @description Get a list of User Templates with optional pagination
 * @summary Get User Templates
 * {@link /api/user_template}
 */
export async function getUserTemplates(
  params?: GetUserTemplatesQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetUserTemplatesQueryResponse, ResponseErrorConfig<GetUserTemplates422>, unknown>({
    method: 'GET',
    url: getGetUserTemplatesUrl().url.toString(),
    params,
    ...requestConfig,
  })
  return getUserTemplatesQueryResponseSchema.parse(res.data)
}
