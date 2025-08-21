import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  ModifyNode200,
  ModifyNode401,
  ModifyNode403,
  ModifyNode422,
  ModifyNodeMutationRequest,
  ModifyNodeMutationResponse,
  ModifyNodePathParams,
} from '../../models/NodeModel/ModifyNode.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { nodeModifySchema } from '../nodeModifySchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const modifyNodePathParamsSchema = z.object({
  node_id: z.coerce.number().int(),
}) as unknown as ToZod<ModifyNodePathParams>

/**
 * @description Successful Response
 */
export const modifyNode200Schema = nodeResponseSchema as unknown as ToZod<ModifyNode200>

/**
 * @description Unauthorized
 */
export const modifyNode401Schema = unauthorizedSchema as unknown as ToZod<ModifyNode401>

/**
 * @description Forbidden
 */
export const modifyNode403Schema = forbiddenSchema as unknown as ToZod<ModifyNode403>

/**
 * @description Validation Error
 */
export const modifyNode422Schema = HTTPValidationErrorSchema as unknown as ToZod<ModifyNode422>

export const modifyNodeMutationRequestSchema = nodeModifySchema as unknown as ToZod<ModifyNodeMutationRequest>

export const modifyNodeMutationResponseSchema = modifyNode200Schema as unknown as ToZod<ModifyNodeMutationResponse>
