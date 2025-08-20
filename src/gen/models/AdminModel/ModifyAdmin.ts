import type { Admin } from '../Admin.ts'
import type { AdminModify } from '../AdminModify.ts'
import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type ModifyAdminPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type ModifyAdmin200 = Admin

/**
 * @description Unauthorized
 */
export type ModifyAdmin401 = Unauthorized

/**
 * @description Forbidden
 */
export type ModifyAdmin403 = Forbidden

/**
 * @description Validation Error
 */
export type ModifyAdmin422 = HTTPValidationError

export type ModifyAdminMutationRequest = AdminModify

export type ModifyAdminMutationResponse = ModifyAdmin200

export type ModifyAdminMutation = {
  Response: ModifyAdmin200
  Request: ModifyAdminMutationRequest
  PathParams: ModifyAdminPathParams
  Errors: ModifyAdmin401 | ModifyAdmin403 | ModifyAdmin422
}
