import type { Forbidden } from '../Forbidden.ts'
import type { ProxyHost } from '../ProxyHost.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * Response Get Hosts Api Hosts Get
 * @description Successful Response
 */
export type GetHosts200 = {
  [key: string]: ProxyHost[]
}

/**
 * Unauthorized
 * @description Unauthorized
 */
export type GetHosts401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type GetHosts403 = Forbidden

export type GetHostsQueryResponse = GetHosts200

export type GetHostsQuery = {
  Response: GetHosts200
  Errors: GetHosts401 | GetHosts403
}
