import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  ModifyHosts200,
  ModifyHosts401,
  ModifyHosts403,
  ModifyHosts422,
  ModifyHostsMutationRequest,
  ModifyHostsMutationResponse,
} from '../../models/SystemModel/ModifyHosts.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { proxyHostSchema } from '../proxyHostSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const modifyHosts200Schema = z.object({}).catchall(z.array(proxyHostSchema)) as unknown as ToZod<ModifyHosts200>

/**
 * @description Unauthorized
 */
export const modifyHosts401Schema = unauthorizedSchema as unknown as ToZod<ModifyHosts401>

/**
 * @description Forbidden
 */
export const modifyHosts403Schema = forbiddenSchema as unknown as ToZod<ModifyHosts403>

/**
 * @description Validation Error
 */
export const modifyHosts422Schema = HTTPValidationErrorSchema as unknown as ToZod<ModifyHosts422>

export const modifyHostsMutationRequestSchema = z
  .object({})
  .catchall(z.array(proxyHostSchema)) as unknown as ToZod<ModifyHostsMutationRequest>

export const modifyHostsMutationResponseSchema = modifyHosts200Schema as unknown as ToZod<ModifyHostsMutationResponse>
