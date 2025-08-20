import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { UserTemplateCreate } from '../UserTemplateCreate.ts'
import type { UserTemplateResponse } from '../UserTemplateResponse.ts'

/**
 * @description Successful Response
 */
export type AddUserTemplate200 = UserTemplateResponse

/**
 * @description Validation Error
 */
export type AddUserTemplate422 = HTTPValidationError

/**
 * @example [object Object]
 */
export type AddUserTemplateMutationRequest = UserTemplateCreate

export type AddUserTemplateMutationResponse = AddUserTemplate200

export type AddUserTemplateMutation = {
  Response: AddUserTemplate200
  Request: AddUserTemplateMutationRequest
  Errors: AddUserTemplate422
}
