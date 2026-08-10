import { z } from 'zod/v4'

import type {
  AddNode200,
  AddNode401,
  AddNode403,
  AddNode409,
  AddNode422,
  AddNodeMutationRequest,
  AddNodeMutationResponse,
} from '../../models/NodeModel/AddNode.ts'
import { conflictSchema } from '../conflictSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { nodeCreateSchema } from '../nodeCreateSchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const addNode200Schema = z.lazy(() => nodeResponseSchema) as unknown as z.ZodType<AddNode200>

/**
 * @description Unauthorized
 */
export const addNode401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<AddNode401>

/**
 * @description Forbidden
 */
export const addNode403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<AddNode403>

/**
 * @description Conflict
 */
export const addNode409Schema = z.lazy(() => conflictSchema) as unknown as z.ZodType<AddNode409>

/**
 * @description Validation Error
 */
export const addNode422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<AddNode422>

export const addNodeMutationRequestSchema = z.lazy(
  () => nodeCreateSchema
) as unknown as z.ZodType<AddNodeMutationRequest>

export const addNodeMutationResponseSchema = z.lazy(
  () => addNode200Schema
) as unknown as z.ZodType<AddNodeMutationResponse>
