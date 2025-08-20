import type { ToZod } from '@kubb/plugin-zod/utils/v4'

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
export const getCurrentAdmin200Schema = adminSchema as unknown as ToZod<GetCurrentAdmin200>

export type GetCurrentAdmin200Schema = GetCurrentAdmin200

/**
 * @description Unauthorized
 */
export const getCurrentAdmin401Schema = unauthorizedSchema as unknown as ToZod<GetCurrentAdmin401>

export type GetCurrentAdmin401Schema = GetCurrentAdmin401

export const getCurrentAdminQueryResponseSchema =
  getCurrentAdmin200Schema as unknown as ToZod<GetCurrentAdminQueryResponse>

export type GetCurrentAdminQueryResponseSchema = GetCurrentAdminQueryResponse
