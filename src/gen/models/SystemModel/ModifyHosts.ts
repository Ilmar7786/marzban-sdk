import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { ProxyHost } from '../ProxyHost.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * Response Modify Hosts Api Hosts Put
 * @description Successful Response
 */
export type ModifyHosts200 = {
  [key: string]: ProxyHost[]
}

/**
 * Unauthorized
 * @description Unauthorized
 */
export type ModifyHosts401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type ModifyHosts403 = Forbidden

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type ModifyHosts422 = HTTPValidationError

/**
 * Modified Hosts
 */
export type ModifyHostsMutationRequest = {
  [key: string]: ProxyHost[]
}

export type ModifyHostsMutationResponse = ModifyHosts200

export type ModifyHostsMutation = {
  Response: ModifyHosts200
  Request: ModifyHostsMutationRequest
  Errors: ModifyHosts401 | ModifyHosts403 | ModifyHosts422
}
