import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type ModifyCoreConfig200 = object

/**
 * @description Unauthorized
 */
export type ModifyCoreConfig401 = Unauthorized

/**
 * @description Forbidden
 */
export type ModifyCoreConfig403 = Forbidden

/**
 * @description Validation Error
 */
export type ModifyCoreConfig422 = HTTPValidationError

export type ModifyCoreConfigMutationRequest = object

export type ModifyCoreConfigMutationResponse = ModifyCoreConfig200

export type ModifyCoreConfigMutation = {
  Response: ModifyCoreConfig200
  Request: ModifyCoreConfigMutationRequest
  Errors: ModifyCoreConfig401 | ModifyCoreConfig403 | ModifyCoreConfig422
}
