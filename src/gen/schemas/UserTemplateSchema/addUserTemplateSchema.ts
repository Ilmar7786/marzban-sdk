import type { ToZod } from '@kubb/plugin-zod/utils/v4'

import type {
  AddUserTemplate200,
  AddUserTemplate422,
  AddUserTemplateMutationRequest,
  AddUserTemplateMutationResponse,
} from '../../models/UserTemplateModel/AddUserTemplate.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { userTemplateCreateSchema } from '../userTemplateCreateSchema.ts'
import { userTemplateResponseSchema } from '../userTemplateResponseSchema.ts'

/**
 * @description Successful Response
 */
export const addUserTemplate200Schema = userTemplateResponseSchema as unknown as ToZod<AddUserTemplate200>

/**
 * @description Validation Error
 */
export const addUserTemplate422Schema = HTTPValidationErrorSchema as unknown as ToZod<AddUserTemplate422>

export const addUserTemplateMutationRequestSchema =
  userTemplateCreateSchema as unknown as ToZod<AddUserTemplateMutationRequest>

export const addUserTemplateMutationResponseSchema =
  addUserTemplate200Schema as unknown as ToZod<AddUserTemplateMutationResponse>
