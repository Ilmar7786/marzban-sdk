import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  DisableAllActiveUsers200,
  DisableAllActiveUsers401,
  DisableAllActiveUsers403,
  DisableAllActiveUsers404,
  DisableAllActiveUsers422,
  DisableAllActiveUsersMutationResponse,
  DisableAllActiveUsersPathParams,
} from '../../models/AdminModel/DisableAllActiveUsers.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const disableAllActiveUsersPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<DisableAllActiveUsersPathParams>

export type DisableAllActiveUsersPathParamsSchema = DisableAllActiveUsersPathParams

/**
 * @description Successful Response
 */
export const disableAllActiveUsers200Schema = z.any() as unknown as ToZod<DisableAllActiveUsers200>

export type DisableAllActiveUsers200Schema = DisableAllActiveUsers200

/**
 * @description Unauthorized
 */
export const disableAllActiveUsers401Schema = unauthorizedSchema as unknown as ToZod<DisableAllActiveUsers401>

export type DisableAllActiveUsers401Schema = DisableAllActiveUsers401

/**
 * @description Forbidden
 */
export const disableAllActiveUsers403Schema = forbiddenSchema as unknown as ToZod<DisableAllActiveUsers403>

export type DisableAllActiveUsers403Schema = DisableAllActiveUsers403

/**
 * @description Not found
 */
export const disableAllActiveUsers404Schema = notFoundSchema as unknown as ToZod<DisableAllActiveUsers404>

export type DisableAllActiveUsers404Schema = DisableAllActiveUsers404

/**
 * @description Validation Error
 */
export const disableAllActiveUsers422Schema = HTTPValidationErrorSchema as unknown as ToZod<DisableAllActiveUsers422>

export type DisableAllActiveUsers422Schema = DisableAllActiveUsers422

export const disableAllActiveUsersMutationResponseSchema =
  disableAllActiveUsers200Schema as unknown as ToZod<DisableAllActiveUsersMutationResponse>

export type DisableAllActiveUsersMutationResponseSchema = DisableAllActiveUsersMutationResponse
