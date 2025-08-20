import type { BodyAdminTokenApiAdminTokenPost } from '../BodyAdminTokenApiAdminTokenPost.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Token } from '../Token.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type AdminToken200 = Token

/**
 * @description Unauthorized
 */
export type AdminToken401 = Unauthorized

/**
 * @description Validation Error
 */
export type AdminToken422 = HTTPValidationError

export type AdminTokenMutationRequest = BodyAdminTokenApiAdminTokenPost

export type AdminTokenMutationResponse = AdminToken200

export type AdminTokenMutation = {
  Response: AdminToken200
  Request: AdminTokenMutationRequest
  Errors: AdminToken401 | AdminToken422
}
