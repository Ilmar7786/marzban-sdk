import type { ToZod } from '@kubb/plugin-zod/utils/v4'

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
export const addUser200Schema = userResponseSchema as unknown as ToZod<AddUser200>

/**
 * @description Bad request
 */
export const addUser400Schema = HTTPExceptionSchema as unknown as ToZod<AddUser400>

/**
 * @description Unauthorized
 */
export const addUser401Schema = unauthorizedSchema as unknown as ToZod<AddUser401>

/**
 * @description Conflict
 */
export const addUser409Schema = conflictSchema as unknown as ToZod<AddUser409>

/**
 * @description Validation Error
 */
export const addUser422Schema = HTTPValidationErrorSchema as unknown as ToZod<AddUser422>

export const addUserMutationRequestSchema = userCreateSchema as unknown as ToZod<AddUserMutationRequest>

export const addUserMutationResponseSchema = addUser200Schema as unknown as ToZod<AddUserMutationResponse>
