import type { HTTPValidationError } from '../HTTPValidationError.ts'

export type RemoveUserTemplatePathParams = {
  /**
   * @type integer
   */
  template_id: number
}

/**
 * @description Successful Response
 */
export type RemoveUserTemplate200 = any

/**
 * @description Validation Error
 */
export type RemoveUserTemplate422 = HTTPValidationError

export type RemoveUserTemplateMutationResponse = RemoveUserTemplate200

export type RemoveUserTemplateMutation = {
  Response: RemoveUserTemplate200
  PathParams: RemoveUserTemplatePathParams
  Errors: RemoveUserTemplate422
}
