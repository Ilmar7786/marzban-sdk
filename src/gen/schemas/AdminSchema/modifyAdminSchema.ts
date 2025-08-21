import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  ModifyAdmin200,
  ModifyAdmin401,
  ModifyAdmin403,
  ModifyAdmin422,
  ModifyAdminMutationRequest,
  ModifyAdminMutationResponse,
  ModifyAdminPathParams,
} from '../../models/AdminModel/ModifyAdmin.ts'
import { adminModifySchema } from '../adminModifySchema.ts'
import { adminSchema } from '../adminSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const modifyAdminPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<ModifyAdminPathParams>

/**
 * @description Successful Response
 */
export const modifyAdmin200Schema = adminSchema as unknown as ToZod<ModifyAdmin200>

/**
 * @description Unauthorized
 */
export const modifyAdmin401Schema = unauthorizedSchema as unknown as ToZod<ModifyAdmin401>

/**
 * @description Forbidden
 */
export const modifyAdmin403Schema = forbiddenSchema as unknown as ToZod<ModifyAdmin403>

/**
 * @description Validation Error
 */
export const modifyAdmin422Schema = HTTPValidationErrorSchema as unknown as ToZod<ModifyAdmin422>

export const modifyAdminMutationRequestSchema = adminModifySchema as unknown as ToZod<ModifyAdminMutationRequest>

export const modifyAdminMutationResponseSchema = modifyAdmin200Schema as unknown as ToZod<ModifyAdminMutationResponse>
