import type { ToZod } from '@kubb/plugin-zod/utils/v4'

import type {
  CreateAdmin200,
  CreateAdmin401,
  CreateAdmin403,
  CreateAdmin409,
  CreateAdmin422,
  CreateAdminMutationRequest,
  CreateAdminMutationResponse,
} from '../../models/AdminModel/CreateAdmin.ts'
import { adminCreateSchema } from '../adminCreateSchema.ts'
import { adminSchema } from '../adminSchema.ts'
import { conflictSchema } from '../conflictSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const createAdmin200Schema = adminSchema as unknown as ToZod<CreateAdmin200>

export type CreateAdmin200Schema = CreateAdmin200

/**
 * @description Unauthorized
 */
export const createAdmin401Schema = unauthorizedSchema as unknown as ToZod<CreateAdmin401>

export type CreateAdmin401Schema = CreateAdmin401

/**
 * @description Forbidden
 */
export const createAdmin403Schema = forbiddenSchema as unknown as ToZod<CreateAdmin403>

export type CreateAdmin403Schema = CreateAdmin403

/**
 * @description Conflict
 */
export const createAdmin409Schema = conflictSchema as unknown as ToZod<CreateAdmin409>

export type CreateAdmin409Schema = CreateAdmin409

/**
 * @description Validation Error
 */
export const createAdmin422Schema = HTTPValidationErrorSchema as unknown as ToZod<CreateAdmin422>

export type CreateAdmin422Schema = CreateAdmin422

export const createAdminMutationRequestSchema = adminCreateSchema as unknown as ToZod<CreateAdminMutationRequest>

export type CreateAdminMutationRequestSchema = CreateAdminMutationRequest

export const createAdminMutationResponseSchema = createAdmin200Schema as unknown as ToZod<CreateAdminMutationResponse>

export type CreateAdminMutationResponseSchema = CreateAdminMutationResponse
