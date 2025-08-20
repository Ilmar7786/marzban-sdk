import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  GetCoreConfig200,
  GetCoreConfig401,
  GetCoreConfig403,
  GetCoreConfigQueryResponse,
} from '../../models/CoreModel/GetCoreConfig.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getCoreConfig200Schema = z.object({}) as unknown as ToZod<GetCoreConfig200>

export type GetCoreConfig200Schema = GetCoreConfig200

/**
 * @description Unauthorized
 */
export const getCoreConfig401Schema = unauthorizedSchema as unknown as ToZod<GetCoreConfig401>

export type GetCoreConfig401Schema = GetCoreConfig401

/**
 * @description Forbidden
 */
export const getCoreConfig403Schema = forbiddenSchema as unknown as ToZod<GetCoreConfig403>

export type GetCoreConfig403Schema = GetCoreConfig403

export const getCoreConfigQueryResponseSchema = getCoreConfig200Schema as unknown as ToZod<GetCoreConfigQueryResponse>

export type GetCoreConfigQueryResponseSchema = GetCoreConfigQueryResponse
