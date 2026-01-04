import { z } from 'zod/v4'

import type { Base200, BaseQueryResponse } from '../../models/DefaultModel/Base.ts'

/**
 * @description Successful Response
 */
export const base200Schema = z.string() as unknown as z.ZodType<Base200>

export const baseQueryResponseSchema = z.lazy(() => base200Schema) as unknown as z.ZodType<BaseQueryResponse>
