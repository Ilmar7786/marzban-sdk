import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserResponse } from '../UserResponse.ts'

export type ActiveNextPlanPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type ActiveNextPlan200 = UserResponse

/**
 * @description Unauthorized
 */
export type ActiveNextPlan401 = Unauthorized

/**
 * @description Forbidden
 */
export type ActiveNextPlan403 = Forbidden

/**
 * @description Not found
 */
export type ActiveNextPlan404 = NotFound

/**
 * @description Validation Error
 */
export type ActiveNextPlan422 = HTTPValidationError

export type ActiveNextPlanMutationResponse = ActiveNextPlan200

export type ActiveNextPlanMutation = {
  Response: ActiveNextPlan200
  PathParams: ActiveNextPlanPathParams
  Errors: ActiveNextPlan401 | ActiveNextPlan403 | ActiveNextPlan404 | ActiveNextPlan422
}
