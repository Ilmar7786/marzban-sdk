import type { Forbidden } from '../Forbidden.ts'
import type { NodeSettings } from '../NodeSettings.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type GetNodeSettings200 = NodeSettings

/**
 * @description Unauthorized
 */
export type GetNodeSettings401 = Unauthorized

/**
 * @description Forbidden
 */
export type GetNodeSettings403 = Forbidden

export type GetNodeSettingsQueryResponse = GetNodeSettings200

export type GetNodeSettingsQuery = {
  Response: GetNodeSettings200
  Errors: GetNodeSettings401 | GetNodeSettings403
}
