import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetUsers400,
  GetUsers401,
  GetUsers403,
  GetUsers404,
  GetUsers422,
  GetUsersQueryParams,
  GetUsersQueryResponse,
} from '../../models/UserModel/GetUsers.ts'
import { getUsersQueryResponseSchema } from '../../schemas/UserSchema/getUsersSchema.ts'

function getGetUsersUrl() {
  const res = {
    method: 'GET',
    url: `/api/users` as const,
  }
  return res
}

/**
 * @description Get all users
 * @summary Get Users
 * {@link /api/users}
 */
export async function getUsers(
  params?: GetUsersQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetUsersQueryResponse,
    ResponseErrorConfig<GetUsers400 | GetUsers401 | GetUsers403 | GetUsers404 | GetUsers422>,
    unknown
  >({
    method: 'GET',
    url: getGetUsersUrl().url.toString(),
    params,
    ...requestConfig,
  })
  return getUsersQueryResponseSchema.parse(res.data)
}
