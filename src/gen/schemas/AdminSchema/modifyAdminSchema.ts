import { z } from 'zod/v4'

import type {
  ModifyAdmin200,
  ModifyAdmin401,
  ModifyAdmin403,
  ModifyAdmin422,
  ModifyAdminMutationRequest,
  ModifyAdminMutationResponse,
  ModifyAdminPathParams,
} from '../../models/AdminModel/ModifyAdmin.ts'
import { adminModifySchema } from '../adminModifySchema.ts'
import { adminSchema } from '../adminSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const modifyAdminPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<ModifyAdminPathParams>

/**
 * @description Successful Response
 */
export const modifyAdmin200Schema = z.lazy(() => adminSchema) as unknown as z.ZodType<ModifyAdmin200>

/**
 * @description Unauthorized
 */
export const modifyAdmin401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ModifyAdmin401>

/**
 * @description Forbidden
 */
export const modifyAdmin403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ModifyAdmin403>

/**
 * @description Validation Error
 */
export const modifyAdmin422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<ModifyAdmin422>

export const modifyAdminMutationRequestSchema = z.lazy(
  () => adminModifySchema
) as unknown as z.ZodType<ModifyAdminMutationRequest>

export const modifyAdminMutationResponseSchema = z.lazy(
  () => modifyAdmin200Schema
) as unknown as z.ZodType<ModifyAdminMutationResponse>
