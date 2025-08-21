import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { GetHosts200, GetHosts401, GetHosts403, GetHostsQueryResponse } from '../../models/SystemModel/GetHosts.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { proxyHostSchema } from '../proxyHostSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getHosts200Schema = z.object({}).catchall(z.array(proxyHostSchema)) as unknown as ToZod<GetHosts200>

/**
 * @description Unauthorized
 */
export const getHosts401Schema = unauthorizedSchema as unknown as ToZod<GetHosts401>

/**
 * @description Forbidden
 */
export const getHosts403Schema = forbiddenSchema as unknown as ToZod<GetHosts403>

export const getHostsQueryResponseSchema = getHosts200Schema as unknown as ToZod<GetHostsQueryResponse>
