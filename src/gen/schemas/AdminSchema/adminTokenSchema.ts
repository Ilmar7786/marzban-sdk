import { z } from 'zod/v4'

import type {
  AdminToken200,
  AdminToken401,
  AdminToken422,
  AdminTokenMutationRequest,
  AdminTokenMutationResponse,
} from '../../models/AdminModel/AdminToken.ts'
import { bodyAdminTokenApiAdminTokenPostSchema } from '../bodyAdminTokenApiAdminTokenPostSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { tokenSchema } from '../tokenSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const adminToken200Schema = z.lazy(() => tokenSchema) as unknown as z.ZodType<AdminToken200>

/**
 * @description Unauthorized
 */
export const adminToken401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<AdminToken401>

/**
 * @description Validation Error
 */
export const adminToken422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<AdminToken422>

export const adminTokenMutationRequestSchema = z.lazy(
  () => bodyAdminTokenApiAdminTokenPostSchema
) as unknown as z.ZodType<AdminTokenMutationRequest>

export const adminTokenMutationResponseSchema = z.lazy(
  () => adminToken200Schema
) as unknown as z.ZodType<AdminTokenMutationResponse>
