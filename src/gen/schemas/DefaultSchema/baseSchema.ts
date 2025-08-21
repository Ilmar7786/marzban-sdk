import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { Base200, BaseQueryResponse } from '../../models/DefaultModel/Base.ts'

/**
 * @description Successful Response
 */
export const base200Schema = z.string() as unknown as ToZod<Base200>

export const baseQueryResponseSchema = base200Schema as unknown as ToZod<BaseQueryResponse>
