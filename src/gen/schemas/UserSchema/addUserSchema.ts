import { z } from 'zod/v4'

import type {
  AddUser200,
  AddUser400,
  AddUser401,
  AddUser409,
  AddUser422,
  AddUserMutationRequest,
  AddUserMutationResponse,
} from '../../models/UserModel/AddUser.ts'
import { conflictSchema } from '../conflictSchema.ts'
import { HTTPExceptionSchema } from '../HTTPExceptionSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userCreateSchema } from '../userCreateSchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

/**
 * @description Successful Response
 */
export const addUser200Schema = z.lazy(() => userResponseSchema) as unknown as z.ZodType<AddUser200>

/**
 * @description Bad request
 */
export const addUser400Schema = z.lazy(() => HTTPExceptionSchema) as unknown as z.ZodType<AddUser400>

/**
 * @description Unauthorized
 */
export const addUser401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<AddUser401>

/**
 * @description Conflict
 */
export const addUser409Schema = z.lazy(() => conflictSchema) as unknown as z.ZodType<AddUser409>

/**
 * @description Validation Error
 */
export const addUser422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<AddUser422>

export const addUserMutationRequestSchema = z.lazy(
  () => userCreateSchema
) as unknown as z.ZodType<AddUserMutationRequest>

export const addUserMutationResponseSchema = z.lazy(
  () => addUser200Schema
) as unknown as z.ZodType<AddUserMutationResponse>
