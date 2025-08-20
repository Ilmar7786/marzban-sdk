import type { ToZod } from '@kubb/plugin-zod/utils/v4'

import type {
  GetNodeSettings200,
  GetNodeSettings401,
  GetNodeSettings403,
  GetNodeSettingsQueryResponse,
} from '../../models/NodeModel/GetNodeSettings.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { nodeSettingsSchema } from '../nodeSettingsSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getNodeSettings200Schema = nodeSettingsSchema as unknown as ToZod<GetNodeSettings200>

export type GetNodeSettings200Schema = GetNodeSettings200

/**
 * @description Unauthorized
 */
export const getNodeSettings401Schema = unauthorizedSchema as unknown as ToZod<GetNodeSettings401>

export type GetNodeSettings401Schema = GetNodeSettings401

/**
 * @description Forbidden
 */
export const getNodeSettings403Schema = forbiddenSchema as unknown as ToZod<GetNodeSettings403>

export type GetNodeSettings403Schema = GetNodeSettings403

export const getNodeSettingsQueryResponseSchema =
  getNodeSettings200Schema as unknown as ToZod<GetNodeSettingsQueryResponse>

export type GetNodeSettingsQueryResponseSchema = GetNodeSettingsQueryResponse
