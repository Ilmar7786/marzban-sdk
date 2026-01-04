import { z } from 'zod/v4'

import type {
  SetOwner200,
  SetOwner401,
  SetOwner422,
  SetOwnerMutationResponse,
  SetOwnerPathParams,
  SetOwnerQueryParams,
} from '../../models/UserModel/SetOwner.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const setOwnerPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<SetOwnerPathParams>

export const setOwnerQueryParamsSchema = z.object({
  admin_username: z.string(),
}) as unknown as z.ZodType<SetOwnerQueryParams>

/**
 * @description Successful Response
 */
export const setOwner200Schema = z.lazy(() => userResponseSchema) as unknown as z.ZodType<SetOwner200>

/**
 * @description Unauthorized
 */
export const setOwner401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<SetOwner401>

/**
 * @description Validation Error
 */
export const setOwner422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<SetOwner422>

export const setOwnerMutationResponseSchema = z.lazy(
  () => setOwner200Schema
) as unknown as z.ZodType<SetOwnerMutationResponse>
