import { z } from 'zod/v4'

import type {
  ActiveNextPlan200,
  ActiveNextPlan401,
  ActiveNextPlan403,
  ActiveNextPlan404,
  ActiveNextPlan422,
  ActiveNextPlanMutationResponse,
  ActiveNextPlanPathParams,
} from '../../models/UserModel/ActiveNextPlan.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const activeNextPlanPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<ActiveNextPlanPathParams>

/**
 * @description Successful Response
 */
export const activeNextPlan200Schema = z.lazy(() => userResponseSchema) as unknown as z.ZodType<ActiveNextPlan200>

/**
 * @description Unauthorized
 */
export const activeNextPlan401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ActiveNextPlan401>

/**
 * @description Forbidden
 */
export const activeNextPlan403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ActiveNextPlan403>

/**
 * @description Not found
 */
export const activeNextPlan404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<ActiveNextPlan404>

/**
 * @description Validation Error
 */
export const activeNextPlan422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<ActiveNextPlan422>

export const activeNextPlanMutationResponseSchema = z.lazy(
  () => activeNextPlan200Schema
) as unknown as z.ZodType<ActiveNextPlanMutationResponse>
