import { z } from 'zod/v4'

import type {
  RemoveUserTemplate200,
  RemoveUserTemplate422,
  RemoveUserTemplateMutationResponse,
  RemoveUserTemplatePathParams,
} from '../../models/UserTemplateModel/RemoveUserTemplate.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'

export const removeUserTemplatePathParamsSchema = z.object({
  template_id: z.coerce.number().int(),
}) as unknown as z.ZodType<RemoveUserTemplatePathParams>

/**
 * @description Successful Response
 */
export const removeUserTemplate200Schema = z.any() as unknown as z.ZodType<RemoveUserTemplate200>

/**
 * @description Validation Error
 */
export const removeUserTemplate422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<RemoveUserTemplate422>

export const removeUserTemplateMutationResponseSchema = z.lazy(
  () => removeUserTemplate200Schema
) as unknown as z.ZodType<RemoveUserTemplateMutationResponse>
