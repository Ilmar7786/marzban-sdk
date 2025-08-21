import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<GetUserTemplateEndpointPathParams>

/**
 * @description Successful Response
 */
export const getUserTemplateEndpoint200Schema =
  userTemplateResponseSchema as unknown as ToZod<GetUserTemplateEndpoint200>

/**
 * @description Validation Error
 */
export const getUserTemplateEndpoint422Schema =
  HTTPValidationErrorSchema as unknown as ToZod<GetUserTemplateEndpoint422>

export const getUserTemplateEndpointQueryResponseSchema =
  getUserTemplateEndpoint200Schema as unknown as ToZod<GetUserTemplateEndpointQueryResponse>
