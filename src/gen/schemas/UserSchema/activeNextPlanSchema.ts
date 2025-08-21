import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<ActiveNextPlanPathParams>

/**
 * @description Successful Response
 */
export const activeNextPlan200Schema = userResponseSchema as unknown as ToZod<ActiveNextPlan200>

/**
 * @description Unauthorized
 */
export const activeNextPlan401Schema = unauthorizedSchema as unknown as ToZod<ActiveNextPlan401>

/**
 * @description Forbidden
 */
export const activeNextPlan403Schema = forbiddenSchema as unknown as ToZod<ActiveNextPlan403>

/**
 * @description Not found
 */
export const activeNextPlan404Schema = notFoundSchema as unknown as ToZod<ActiveNextPlan404>

/**
 * @description Validation Error
 */
export const activeNextPlan422Schema = HTTPValidationErrorSchema as unknown as ToZod<ActiveNextPlan422>

export const activeNextPlanMutationResponseSchema =
  activeNextPlan200Schema as unknown as ToZod<ActiveNextPlanMutationResponse>
