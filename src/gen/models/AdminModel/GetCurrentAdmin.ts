import type { Admin } from '../Admin.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type GetCurrentAdmin200 = Admin

/**
 * @description Unauthorized
 */
export type GetCurrentAdmin401 = Unauthorized

export type GetCurrentAdminQueryResponse = GetCurrentAdmin200

export type GetCurrentAdminQuery = {
  Response: GetCurrentAdmin200
  Errors: GetCurrentAdmin401
}
