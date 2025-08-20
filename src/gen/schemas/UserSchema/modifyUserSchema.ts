import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  ModifyUser200,
  ModifyUser400,
  ModifyUser401,
  ModifyUser403,
  ModifyUser404,
  ModifyUser422,
  ModifyUserMutationRequest,
  ModifyUserMutationResponse,
  ModifyUserPathParams,
} from '../../models/UserModel/ModifyUser.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPExceptionSchema } from '../HTTPExceptionSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userModifySchema } from '../userModifySchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const modifyUserPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<ModifyUserPathParams>

export type ModifyUserPathParamsSchema = ModifyUserPathParams

/**
 * @description Successful Response
 */
export const modifyUser200Schema = userResponseSchema as unknown as ToZod<ModifyUser200>

export type ModifyUser200Schema = ModifyUser200

/**
 * @description Bad request
 */
export const modifyUser400Schema = HTTPExceptionSchema as unknown as ToZod<ModifyUser400>

export type ModifyUser400Schema = ModifyUser400

/**
 * @description Unauthorized
 */
export const modifyUser401Schema = unauthorizedSchema as unknown as ToZod<ModifyUser401>

export type ModifyUser401Schema = ModifyUser401

/**
 * @description Forbidden
 */
export const modifyUser403Schema = forbiddenSchema as unknown as ToZod<ModifyUser403>

export type ModifyUser403Schema = ModifyUser403

/**
 * @description Not found
 */
export const modifyUser404Schema = notFoundSchema as unknown as ToZod<ModifyUser404>

export type ModifyUser404Schema = ModifyUser404

/**
 * @description Validation Error
 */
export const modifyUser422Schema = HTTPValidationErrorSchema as unknown as ToZod<ModifyUser422>

export type ModifyUser422Schema = ModifyUser422

export const modifyUserMutationRequestSchema = userModifySchema as unknown as ToZod<ModifyUserMutationRequest>

export type ModifyUserMutationRequestSchema = ModifyUserMutationRequest

export const modifyUserMutationResponseSchema = modifyUser200Schema as unknown as ToZod<ModifyUserMutationResponse>

export type ModifyUserMutationResponseSchema = ModifyUserMutationResponse
