import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<SetOwnerPathParams>

export const setOwnerQueryParamsSchema = z.object({
  admin_username: z.string(),
}) as unknown as ToZod<SetOwnerQueryParams>

/**
 * @description Successful Response
 */
export const setOwner200Schema = userResponseSchema as unknown as ToZod<SetOwner200>

/**
 * @description Unauthorized
 */
export const setOwner401Schema = unauthorizedSchema as unknown as ToZod<SetOwner401>

/**
 * @description Validation Error
 */
export const setOwner422Schema = HTTPValidationErrorSchema as unknown as ToZod<SetOwner422>

export const setOwnerMutationResponseSchema = setOwner200Schema as unknown as ToZod<SetOwnerMutationResponse>
