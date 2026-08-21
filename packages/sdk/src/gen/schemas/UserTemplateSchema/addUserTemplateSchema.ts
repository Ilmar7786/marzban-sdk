import { z } from 'zod/v4'

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
export const addUserTemplate200Schema = z.lazy(
  () => userTemplateResponseSchema
) as unknown as z.ZodType<AddUserTemplate200>

/**
 * @description Validation Error
 */
export const addUserTemplate422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<AddUserTemplate422>

export const addUserTemplateMutationRequestSchema = z.lazy(
  () => userTemplateCreateSchema
) as unknown as z.ZodType<AddUserTemplateMutationRequest>

export const addUserTemplateMutationResponseSchema = z.lazy(
  () => addUserTemplate200Schema
) as unknown as z.ZodType<AddUserTemplateMutationResponse>
