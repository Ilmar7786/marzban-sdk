import type { ToZod } from '@kubb/plugin-zod/utils/v4'

import type {
  AddNode200,
  AddNode401,
  AddNode403,
  AddNode409,
  AddNode422,
  AddNodeMutationRequest,
  AddNodeMutationResponse,
} from '../../models/NodeModel/AddNode.ts'
import { conflictSchema } from '../conflictSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { nodeCreateSchema } from '../nodeCreateSchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const addNode200Schema = nodeResponseSchema as unknown as ToZod<AddNode200>

export type AddNode200Schema = AddNode200

/**
 * @description Unauthorized
 */
export const addNode401Schema = unauthorizedSchema as unknown as ToZod<AddNode401>

export type AddNode401Schema = AddNode401

/**
 * @description Forbidden
 */
export const addNode403Schema = forbiddenSchema as unknown as ToZod<AddNode403>

export type AddNode403Schema = AddNode403

/**
 * @description Conflict
 */
export const addNode409Schema = conflictSchema as unknown as ToZod<AddNode409>

export type AddNode409Schema = AddNode409

/**
 * @description Validation Error
 */
export const addNode422Schema = HTTPValidationErrorSchema as unknown as ToZod<AddNode422>

export type AddNode422Schema = AddNode422

export const addNodeMutationRequestSchema = nodeCreateSchema as unknown as ToZod<AddNodeMutationRequest>

export type AddNodeMutationRequestSchema = AddNodeMutationRequest

export const addNodeMutationResponseSchema = addNode200Schema as unknown as ToZod<AddNodeMutationResponse>

export type AddNodeMutationResponseSchema = AddNodeMutationResponse
