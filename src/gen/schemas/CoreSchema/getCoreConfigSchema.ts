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
export const getCoreConfig200Schema = z.object({}) as unknown as z.ZodType<GetCoreConfig200>

/**
 * @description Unauthorized
 */
export const getCoreConfig401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetCoreConfig401>

/**
 * @description Forbidden
 */
export const getCoreConfig403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetCoreConfig403>

export const getCoreConfigQueryResponseSchema = z.lazy(
  () => getCoreConfig200Schema
) as unknown as z.ZodType<GetCoreConfigQueryResponse>
