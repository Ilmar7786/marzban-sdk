import type { Forbidden } from '../Forbidden.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type RestartCore200 = any

/**
 * @description Unauthorized
 */
export type RestartCore401 = Unauthorized

/**
 * @description Forbidden
 */
export type RestartCore403 = Forbidden

export type RestartCoreMutationResponse = RestartCore200

export type RestartCoreMutation = {
  Response: RestartCore200
  Errors: RestartCore401 | RestartCore403
}
