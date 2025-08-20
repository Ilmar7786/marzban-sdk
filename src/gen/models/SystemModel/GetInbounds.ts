import type { ProxyInbound } from '../ProxyInbound.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type GetInbounds200 = {
  [key: string]: ProxyInbound[]
}

/**
 * @description Unauthorized
 */
export type GetInbounds401 = Unauthorized

export type GetInboundsQueryResponse = GetInbounds200

export type GetInboundsQuery = {
  Response: GetInbounds200
  Errors: GetInbounds401
}
