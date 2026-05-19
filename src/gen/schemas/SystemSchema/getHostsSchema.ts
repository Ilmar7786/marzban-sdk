import { z } from 'zod/v4'

import type { GetHosts200, GetHosts401, GetHosts403, GetHostsQueryResponse } from '../../models/SystemModel/GetHosts.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { proxyHostSchema } from '../proxyHostSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getHosts200Schema = z
  .object({})
  .catchall(z.array(z.lazy(() => proxyHostSchema))) as unknown as z.ZodType<GetHosts200>

/**
 * @description Unauthorized
 */
export const getHosts401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetHosts401>

/**
 * @description Forbidden
 */
export const getHosts403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetHosts403>

export const getHostsQueryResponseSchema = z.lazy(
  () => getHosts200Schema
) as unknown as z.ZodType<GetHostsQueryResponse>
