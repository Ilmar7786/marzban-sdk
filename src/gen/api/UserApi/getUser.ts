import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetUser401,
  GetUser403,
  GetUser404,
  GetUser422,
  GetUserPathParams,
  GetUserQueryResponse,
} from '../../models/UserModel/GetUser.ts'
import { getUserQueryResponseSchema } from '../../schemas/UserSchema/getUserSchema.ts'

function getGetUserUrl(username: GetUserPathParams['username']) {
  const res = {
    method: 'GET',
    url: `/api/user/${username}` as const,
  }
  return res
}

/**
 * @description Get user information
 * @summary Get User
 * {@link /api/user/:username}
 */
export async function getUser(
  username: GetUserPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetUserQueryResponse,
    ResponseErrorConfig<GetUser401 | GetUser403 | GetUser404 | GetUser422>,
    unknown
  >({
    method: 'GET',
    url: getGetUserUrl(username).url.toString(),
    ...requestConfig,
  })
  return getUserQueryResponseSchema.parse(res.data)
}
