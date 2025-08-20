import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<ActivateAllDisabledUsersPathParams>

export type ActivateAllDisabledUsersPathParamsSchema = ActivateAllDisabledUsersPathParams

/**
 * @description Successful Response
 */
export const activateAllDisabledUsers200Schema = z.any() as unknown as ToZod<ActivateAllDisabledUsers200>

export type ActivateAllDisabledUsers200Schema = ActivateAllDisabledUsers200

/**
 * @description Unauthorized
 */
export const activateAllDisabledUsers401Schema = unauthorizedSchema as unknown as ToZod<ActivateAllDisabledUsers401>

export type ActivateAllDisabledUsers401Schema = ActivateAllDisabledUsers401

/**
 * @description Forbidden
 */
export const activateAllDisabledUsers403Schema = forbiddenSchema as unknown as ToZod<ActivateAllDisabledUsers403>

export type ActivateAllDisabledUsers403Schema = ActivateAllDisabledUsers403

/**
 * @description Not found
 */
export const activateAllDisabledUsers404Schema = notFoundSchema as unknown as ToZod<ActivateAllDisabledUsers404>

export type ActivateAllDisabledUsers404Schema = ActivateAllDisabledUsers404

/**
 * @description Validation Error
 */
export const activateAllDisabledUsers422Schema =
  HTTPValidationErrorSchema as unknown as ToZod<ActivateAllDisabledUsers422>

export type ActivateAllDisabledUsers422Schema = ActivateAllDisabledUsers422

export const activateAllDisabledUsersMutationResponseSchema =
  activateAllDisabledUsers200Schema as unknown as ToZod<ActivateAllDisabledUsersMutationResponse>

export type ActivateAllDisabledUsersMutationResponseSchema = ActivateAllDisabledUsersMutationResponse
