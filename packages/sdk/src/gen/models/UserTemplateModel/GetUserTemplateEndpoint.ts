import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { UserTemplateResponse } from '../UserTemplateResponse.ts'

export type GetUserTemplateEndpointPathParams = {
  /**
   * @type integer
   */
  template_id: number
}

/**
 * UserTemplateResponse
 * @description Successful Response
 */
export type GetUserTemplateEndpoint200 = UserTemplateResponse

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type GetUserTemplateEndpoint422 = HTTPValidationError

export type GetUserTemplateEndpointQueryResponse = GetUserTemplateEndpoint200

export type GetUserTemplateEndpointQuery = {
  Response: GetUserTemplateEndpoint200
  PathParams: GetUserTemplateEndpointPathParams
  Errors: GetUserTemplateEndpoint422
}
