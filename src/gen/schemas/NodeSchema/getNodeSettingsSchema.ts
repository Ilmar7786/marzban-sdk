import { z } from 'zod/v4'

import type {
  GetNodeSettings200,
  GetNodeSettings401,
  GetNodeSettings403,
  GetNodeSettingsQueryResponse,
} from '../../models/NodeModel/GetNodeSettings.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { nodeSettingsSchema } from '../nodeSettingsSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getNodeSettings200Schema = z.lazy(() => nodeSettingsSchema) as unknown as z.ZodType<GetNodeSettings200>

/**
 * @description Unauthorized
 */
export const getNodeSettings401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetNodeSettings401>

/**
 * @description Forbidden
 */
export const getNodeSettings403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetNodeSettings403>

export const getNodeSettingsQueryResponseSchema = z.lazy(
  () => getNodeSettings200Schema
) as unknown as z.ZodType<GetNodeSettingsQueryResponse>
