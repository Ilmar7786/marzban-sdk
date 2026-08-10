import { z } from 'zod/v4'

import type {
  GetUserTemplates200,
  GetUserTemplates422,
  GetUserTemplatesQueryParams,
  GetUserTemplatesQueryResponse,
} from '../../models/UserTemplateModel/GetUserTemplates.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { userTemplateResponseSchema } from '../userTemplateResponseSchema.ts'

export const getUserTemplatesQueryParamsSchema = z
  .object({
    offset: z.optional(z.coerce.number().int()),
    limit: z.optional(z.coerce.number().int()),
  })
  .optional() as unknown as z.ZodType<GetUserTemplatesQueryParams>

/**
 * @description Successful Response
 */
export const getUserTemplates200Schema = z.array(
  z.lazy(() => userTemplateResponseSchema)
) as unknown as z.ZodType<GetUserTemplates200>

/**
 * @description Validation Error
 */
export const getUserTemplates422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<GetUserTemplates422>

export const getUserTemplatesQueryResponseSchema = z.lazy(
  () => getUserTemplates200Schema
) as unknown as z.ZodType<GetUserTemplatesQueryResponse>
