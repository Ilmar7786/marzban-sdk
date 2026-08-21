import { z } from 'zod/v4'

import type { GetNodes200, GetNodes401, GetNodes403, GetNodesQueryResponse } from '../../models/NodeModel/GetNodes.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getNodes200Schema = z.array(z.lazy(() => nodeResponseSchema)) as unknown as z.ZodType<GetNodes200>

/**
 * @description Unauthorized
 */
export const getNodes401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetNodes401>

/**
 * @description Forbidden
 */
export const getNodes403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetNodes403>

export const getNodesQueryResponseSchema = z.lazy(
  () => getNodes200Schema
) as unknown as z.ZodType<GetNodesQueryResponse>
