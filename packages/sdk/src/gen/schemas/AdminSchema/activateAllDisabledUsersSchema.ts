import { z } from 'zod/v4'

import type {
  ActivateAllDisabledUsers200,
  ActivateAllDisabledUsers401,
  ActivateAllDisabledUsers403,
  ActivateAllDisabledUsers404,
  ActivateAllDisabledUsers422,
  ActivateAllDisabledUsersMutationResponse,
  ActivateAllDisabledUsersPathParams,
} from '../../models/AdminModel/ActivateAllDisabledUsers.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const activateAllDisabledUsersPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<ActivateAllDisabledUsersPathParams>

/**
 * @description Successful Response
 */
export const activateAllDisabledUsers200Schema = z.any() as unknown as z.ZodType<ActivateAllDisabledUsers200>

/**
 * @description Unauthorized
 */
export const activateAllDisabledUsers401Schema = z.lazy(
  () => unauthorizedSchema
) as unknown as z.ZodType<ActivateAllDisabledUsers401>

/**
 * @description Forbidden
 */
export const activateAllDisabledUsers403Schema = z.lazy(
  () => forbiddenSchema
) as unknown as z.ZodType<ActivateAllDisabledUsers403>

/**
 * @description Not found
 */
export const activateAllDisabledUsers404Schema = z.lazy(
  () => notFoundSchema
) as unknown as z.ZodType<ActivateAllDisabledUsers404>

/**
 * @description Validation Error
 */
export const activateAllDisabledUsers422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<ActivateAllDisabledUsers422>

export const activateAllDisabledUsersMutationResponseSchema = z.lazy(
  () => activateAllDisabledUsers200Schema
) as unknown as z.ZodType<ActivateAllDisabledUsersMutationResponse>
