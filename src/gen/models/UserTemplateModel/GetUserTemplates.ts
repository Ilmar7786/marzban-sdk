import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { UserTemplateResponse } from '../UserTemplateResponse.ts'

export type GetUserTemplatesQueryParams = {
  /**
   * @type integer | undefined
   */
  offset?: number
  /**
   * @type integer | undefined
   */
  limit?: number
}

/**
 * @description Successful Response
 */
export type GetUserTemplates200 = UserTemplateResponse[]

/**
 * @description Validation Error
 */
export type GetUserTemplates422 = HTTPValidationError

export type GetUserTemplatesQueryResponse = GetUserTemplates200

export type GetUserTemplatesQuery = {
  Response: GetUserTemplates200
  QueryParams: GetUserTemplatesQueryParams
  Errors: GetUserTemplates422
}
