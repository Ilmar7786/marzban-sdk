import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  GetNode200,
  GetNode401,
  GetNode403,
  GetNode422,
  GetNodePathParams,
  GetNodeQueryResponse,
} from '../../models/NodeModel/GetNode.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const getNodePathParamsSchema = z.object({
  node_id: z.coerce.number().int(),
}) as unknown as ToZod<GetNodePathParams>

export type GetNodePathParamsSchema = GetNodePathParams

/**
 * @description Successful Response
 */
export const getNode200Schema = nodeResponseSchema as unknown as ToZod<GetNode200>

export type GetNode200Schema = GetNode200

/**
 * @description Unauthorized
 */
export const getNode401Schema = unauthorizedSchema as unknown as ToZod<GetNode401>

export type GetNode401Schema = GetNode401

/**
 * @description Forbidden
 */
export const getNode403Schema = forbiddenSchema as unknown as ToZod<GetNode403>

export type GetNode403Schema = GetNode403

/**
 * @description Validation Error
 */
export const getNode422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetNode422>

export type GetNode422Schema = GetNode422

export const getNodeQueryResponseSchema = getNode200Schema as unknown as ToZod<GetNodeQueryResponse>

export type GetNodeQueryResponseSchema = GetNodeQueryResponse
