import { z } from 'zod/v4'

import type {
  ModifyUserTemplate200,
  ModifyUserTemplate422,
  ModifyUserTemplateMutationRequest,
  ModifyUserTemplateMutationResponse,
  ModifyUserTemplatePathParams,
} from '../../models/UserTemplateModel/ModifyUserTemplate.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { userTemplateModifySchema } from '../userTemplateModifySchema.ts'
import { userTemplateResponseSchema } from '../userTemplateResponseSchema.ts'

export const modifyUserTemplatePathParamsSchema = z.object({
  template_id: z.coerce.number().int(),
}) as unknown as z.ZodType<ModifyUserTemplatePathParams>

/**
 * @description Successful Response
 */
export const modifyUserTemplate200Schema = z.lazy(
  () => userTemplateResponseSchema
) as unknown as z.ZodType<ModifyUserTemplate200>

/**
 * @description Validation Error
 */
export const modifyUserTemplate422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<ModifyUserTemplate422>

export const modifyUserTemplateMutationRequestSchema = z.lazy(
  () => userTemplateModifySchema
) as unknown as z.ZodType<ModifyUserTemplateMutationRequest>

export const modifyUserTemplateMutationResponseSchema = z.lazy(
  () => modifyUserTemplate200Schema
) as unknown as z.ZodType<ModifyUserTemplateMutationResponse>
