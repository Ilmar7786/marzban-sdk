import type { BodyAdminTokenApiAdminTokenPost } from '../BodyAdminTokenApiAdminTokenPost.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Token } from '../Token.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * Token
 * @description Successful Response
 */
export type AdminToken200 = Token

/**
 * Unauthorized
 * @description Unauthorized
 */
export type AdminToken401 = Unauthorized

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type AdminToken422 = HTTPValidationError

/**
 * Body_admin_token_api_admin_token_post
 */
export type AdminTokenMutationRequest = BodyAdminTokenApiAdminTokenPost

export type AdminTokenMutationResponse = AdminToken200

export type AdminTokenMutation = {
  Response: AdminToken200
  Request: AdminTokenMutationRequest
  Errors: AdminToken401 | AdminToken422
}
