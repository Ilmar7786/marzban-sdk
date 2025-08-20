import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  ReconnectNode200,
  ReconnectNode401,
  ReconnectNode403,
  ReconnectNode422,
  ReconnectNodeMutationResponse,
  ReconnectNodePathParams,
} from '../../models/NodeModel/ReconnectNode.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const reconnectNodePathParamsSchema = z.object({
  node_id: z.coerce.number().int(),
}) as unknown as ToZod<ReconnectNodePathParams>

export type ReconnectNodePathParamsSchema = ReconnectNodePathParams

/**
 * @description Successful Response
 */
export const reconnectNode200Schema = z.any() as unknown as ToZod<ReconnectNode200>

export type ReconnectNode200Schema = ReconnectNode200

/**
 * @description Unauthorized
 */
export const reconnectNode401Schema = unauthorizedSchema as unknown as ToZod<ReconnectNode401>

export type ReconnectNode401Schema = ReconnectNode401

/**
 * @description Forbidden
 */
export const reconnectNode403Schema = forbiddenSchema as unknown as ToZod<ReconnectNode403>

export type ReconnectNode403Schema = ReconnectNode403

/**
 * @description Validation Error
 */
export const reconnectNode422Schema = HTTPValidationErrorSchema as unknown as ToZod<ReconnectNode422>

export type ReconnectNode422Schema = ReconnectNode422

export const reconnectNodeMutationResponseSchema =
  reconnectNode200Schema as unknown as ToZod<ReconnectNodeMutationResponse>

export type ReconnectNodeMutationResponseSchema = ReconnectNodeMutationResponse
