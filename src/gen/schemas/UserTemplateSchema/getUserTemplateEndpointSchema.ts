import { z } from 'zod/v4'

import type {
  GetUserTemplateEndpoint200,
  GetUserTemplateEndpoint422,
  GetUserTemplateEndpointPathParams,
  GetUserTemplateEndpointQueryResponse,
} from '../../models/UserTemplateModel/GetUserTemplateEndpoint.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { userTemplateResponseSchema } from '../userTemplateResponseSchema.ts'

export const getUserTemplateEndpointPathParamsSchema = z.object({
  template_id: z.coerce.number().int(),
}) as unknown as z.ZodType<GetUserTemplateEndpointPathParams>

/**
 * @description Successful Response
 */
export const getUserTemplateEndpoint200Schema = z.lazy(
  () => userTemplateResponseSchema
) as unknown as z.ZodType<GetUserTemplateEndpoint200>

/**
 * @description Validation Error
 */
export const getUserTemplateEndpoint422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<GetUserTemplateEndpoint422>

export const getUserTemplateEndpointQueryResponseSchema = z.lazy(
  () => getUserTemplateEndpoint200Schema
) as unknown as z.ZodType<GetUserTemplateEndpointQueryResponse>
