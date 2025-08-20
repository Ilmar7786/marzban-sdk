import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { UserTemplateModify } from '../UserTemplateModify.ts'
import type { UserTemplateResponse } from '../UserTemplateResponse.ts'

export type ModifyUserTemplatePathParams = {
  /**
   * @type integer
   */
  template_id: number
}

/**
 * @description Successful Response
 */
export type ModifyUserTemplate200 = UserTemplateResponse

/**
 * @description Validation Error
 */
export type ModifyUserTemplate422 = HTTPValidationError

/**
 * @example [object Object]
 */
export type ModifyUserTemplateMutationRequest = UserTemplateModify

export type ModifyUserTemplateMutationResponse = ModifyUserTemplate200

export type ModifyUserTemplateMutation = {
  Response: ModifyUserTemplate200
  Request: ModifyUserTemplateMutationRequest
  PathParams: ModifyUserTemplatePathParams
  Errors: ModifyUserTemplate422
}
