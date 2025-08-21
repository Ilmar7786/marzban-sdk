import type { ToZod } from '@kubb/plugin-zod/utils/v4'

import type {
  AdminToken200,
  AdminToken401,
  AdminToken422,
  AdminTokenMutationRequest,
  AdminTokenMutationResponse,
} from '../../models/AdminModel/AdminToken.ts'
import { bodyAdminTokenApiAdminTokenPostSchema } from '../bodyAdminTokenApiAdminTokenPostSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { tokenSchema } from '../tokenSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const adminToken200Schema = tokenSchema as unknown as ToZod<AdminToken200>

/**
 * @description Unauthorized
 */
export const adminToken401Schema = unauthorizedSchema as unknown as ToZod<AdminToken401>

/**
 * @description Validation Error
 */
export const adminToken422Schema = HTTPValidationErrorSchema as unknown as ToZod<AdminToken422>

export const adminTokenMutationRequestSchema =
  bodyAdminTokenApiAdminTokenPostSchema as unknown as ToZod<AdminTokenMutationRequest>

export const adminTokenMutationResponseSchema = adminToken200Schema as unknown as ToZod<AdminTokenMutationResponse>
