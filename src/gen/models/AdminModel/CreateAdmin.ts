import type { Admin } from '../Admin.ts'
import type { AdminCreate } from '../AdminCreate.ts'
import type { Conflict } from '../Conflict.ts'
import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type CreateAdmin200 = Admin

/**
 * @description Unauthorized
 */
export type CreateAdmin401 = Unauthorized

/**
 * @description Forbidden
 */
export type CreateAdmin403 = Forbidden

/**
 * @description Conflict
 */
export type CreateAdmin409 = Conflict

/**
 * @description Validation Error
 */
export type CreateAdmin422 = HTTPValidationError

export type CreateAdminMutationRequest = AdminCreate

export type CreateAdminMutationResponse = CreateAdmin200

export type CreateAdminMutation = {
  Response: CreateAdmin200
  Request: CreateAdminMutationRequest
  Errors: CreateAdmin401 | CreateAdmin403 | CreateAdmin409 | CreateAdmin422
}
