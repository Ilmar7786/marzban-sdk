import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { GetNodes200, GetNodes401, GetNodes403, GetNodesQueryResponse } from '../../models/NodeModel/GetNodes.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getNodes200Schema = z.array(nodeResponseSchema) as unknown as ToZod<GetNodes200>

export type GetNodes200Schema = GetNodes200

/**
 * @description Unauthorized
 */
export const getNodes401Schema = unauthorizedSchema as unknown as ToZod<GetNodes401>

export type GetNodes401Schema = GetNodes401

/**
 * @description Forbidden
 */
export const getNodes403Schema = forbiddenSchema as unknown as ToZod<GetNodes403>

export type GetNodes403Schema = GetNodes403

export const getNodesQueryResponseSchema = getNodes200Schema as unknown as ToZod<GetNodesQueryResponse>

export type GetNodesQueryResponseSchema = GetNodesQueryResponse
