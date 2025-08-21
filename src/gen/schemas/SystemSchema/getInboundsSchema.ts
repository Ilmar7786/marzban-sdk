import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { GetInbounds200, GetInbounds401, GetInboundsQueryResponse } from '../../models/SystemModel/GetInbounds.ts'
import { proxyInboundSchema } from '../proxyInboundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getInbounds200Schema = z
  .object({})
  .catchall(z.array(proxyInboundSchema)) as unknown as ToZod<GetInbounds200>

/**
 * @description Unauthorized
 */
export const getInbounds401Schema = unauthorizedSchema as unknown as ToZod<GetInbounds401>

export const getInboundsQueryResponseSchema = getInbounds200Schema as unknown as ToZod<GetInboundsQueryResponse>
