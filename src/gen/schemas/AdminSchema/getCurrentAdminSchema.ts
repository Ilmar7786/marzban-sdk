import { z } from 'zod/v4'

import type {
  GetCurrentAdmin200,
  GetCurrentAdmin401,
  GetCurrentAdminQueryResponse,
} from '../../models/AdminModel/GetCurrentAdmin.ts'
import { adminSchema } from '../adminSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getCurrentAdmin200Schema = z.lazy(() => adminSchema) as unknown as z.ZodType<GetCurrentAdmin200>

/**
 * @description Unauthorized
 */
export const getCurrentAdmin401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetCurrentAdmin401>

export const getCurrentAdminQueryResponseSchema = z.lazy(
  () => getCurrentAdmin200Schema
) as unknown as z.ZodType<GetCurrentAdminQueryResponse>
