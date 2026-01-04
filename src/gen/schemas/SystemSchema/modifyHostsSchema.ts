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
export const modifyHosts200Schema = z
  .object({})
  .catchall(z.array(z.lazy(() => proxyHostSchema))) as unknown as z.ZodType<ModifyHosts200>

/**
 * @description Unauthorized
 */
export const modifyHosts401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ModifyHosts401>

/**
 * @description Forbidden
 */
export const modifyHosts403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ModifyHosts403>

/**
 * @description Validation Error
 */
export const modifyHosts422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<ModifyHosts422>

export const modifyHostsMutationRequestSchema = z
  .object({})
  .catchall(z.array(z.lazy(() => proxyHostSchema))) as unknown as z.ZodType<ModifyHostsMutationRequest>

export const modifyHostsMutationResponseSchema = z.lazy(
  () => modifyHosts200Schema
) as unknown as z.ZodType<ModifyHostsMutationResponse>
