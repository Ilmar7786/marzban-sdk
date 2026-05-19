import { z } from 'zod/v4'

import type {
  CreateAdmin200,
  CreateAdmin401,
  CreateAdmin403,
  CreateAdmin409,
  CreateAdmin422,
  CreateAdminMutationRequest,
  CreateAdminMutationResponse,
} from '../../models/AdminModel/CreateAdmin.ts'
import { adminCreateSchema } from '../adminCreateSchema.ts'
import { adminSchema } from '../adminSchema.ts'
import { conflictSchema } from '../conflictSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const createAdmin200Schema = z.lazy(() => adminSchema) as unknown as z.ZodType<CreateAdmin200>

/**
 * @description Unauthorized
 */
export const createAdmin401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<CreateAdmin401>

/**
 * @description Forbidden
 */
export const createAdmin403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<CreateAdmin403>

/**
 * @description Conflict
 */
export const createAdmin409Schema = z.lazy(() => conflictSchema) as unknown as z.ZodType<CreateAdmin409>

/**
 * @description Validation Error
 */
export const createAdmin422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<CreateAdmin422>

export const createAdminMutationRequestSchema = z.lazy(
  () => adminCreateSchema
) as unknown as z.ZodType<CreateAdminMutationRequest>

export const createAdminMutationResponseSchema = z.lazy(
  () => createAdmin200Schema
) as unknown as z.ZodType<CreateAdminMutationResponse>
