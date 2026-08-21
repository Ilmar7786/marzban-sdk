import { z } from 'zod/v4'

import type { GetInbounds200, GetInbounds401, GetInboundsQueryResponse } from '../../models/SystemModel/GetInbounds.ts'
import { proxyInboundSchema } from '../proxyInboundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getInbounds200Schema = z
  .object({})
  .catchall(z.array(z.lazy(() => proxyInboundSchema))) as unknown as z.ZodType<GetInbounds200>

/**
 * @description Unauthorized
 */
export const getInbounds401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetInbounds401>

export const getInboundsQueryResponseSchema = z.lazy(
  () => getInbounds200Schema
) as unknown as z.ZodType<GetInboundsQueryResponse>
