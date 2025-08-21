import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
    offset: z.coerce.number().int().optional(),
    limit: z.coerce.number().int().optional(),
  })
  .optional() as unknown as ToZod<GetUserTemplatesQueryParams>

/**
 * @description Successful Response
 */
export const getUserTemplates200Schema = z.array(userTemplateResponseSchema) as unknown as ToZod<GetUserTemplates200>

/**
 * @description Validation Error
 */
export const getUserTemplates422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetUserTemplates422>

export const getUserTemplatesQueryResponseSchema =
  getUserTemplates200Schema as unknown as ToZod<GetUserTemplatesQueryResponse>
