import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { ProxyHost } from '../ProxyHost.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type ModifyHosts200 = {
  [key: string]: ProxyHost[]
}

/**
 * @description Unauthorized
 */
export type ModifyHosts401 = Unauthorized

/**
 * @description Forbidden
 */
export type ModifyHosts403 = Forbidden

/**
 * @description Validation Error
 */
export type ModifyHosts422 = HTTPValidationError

export type ModifyHostsMutationRequest = {
  [key: string]: ProxyHost[]
}

export type ModifyHostsMutationResponse = ModifyHosts200

export type ModifyHostsMutation = {
  Response: ModifyHosts200
  Request: ModifyHostsMutationRequest
  Errors: ModifyHosts401 | ModifyHosts403 | ModifyHosts422
}
