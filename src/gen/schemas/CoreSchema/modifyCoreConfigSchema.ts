import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  ModifyCoreConfig200,
  ModifyCoreConfig401,
  ModifyCoreConfig403,
  ModifyCoreConfig422,
  ModifyCoreConfigMutationRequest,
  ModifyCoreConfigMutationResponse,
} from '../../models/CoreModel/ModifyCoreConfig.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const modifyCoreConfig200Schema = z.object({}) as unknown as ToZod<ModifyCoreConfig200>

export type ModifyCoreConfig200Schema = ModifyCoreConfig200

/**
 * @description Unauthorized
 */
export const modifyCoreConfig401Schema = unauthorizedSchema as unknown as ToZod<ModifyCoreConfig401>

export type ModifyCoreConfig401Schema = ModifyCoreConfig401

/**
 * @description Forbidden
 */
export const modifyCoreConfig403Schema = forbiddenSchema as unknown as ToZod<ModifyCoreConfig403>

export type ModifyCoreConfig403Schema = ModifyCoreConfig403

/**
 * @description Validation Error
 */
export const modifyCoreConfig422Schema = HTTPValidationErrorSchema as unknown as ToZod<ModifyCoreConfig422>

export type ModifyCoreConfig422Schema = ModifyCoreConfig422

export const modifyCoreConfigMutationRequestSchema = z.object({}) as unknown as ToZod<ModifyCoreConfigMutationRequest>

export type ModifyCoreConfigMutationRequestSchema = ModifyCoreConfigMutationRequest

export const modifyCoreConfigMutationResponseSchema =
  modifyCoreConfig200Schema as unknown as ToZod<ModifyCoreConfigMutationResponse>

export type ModifyCoreConfigMutationResponseSchema = ModifyCoreConfigMutationResponse
