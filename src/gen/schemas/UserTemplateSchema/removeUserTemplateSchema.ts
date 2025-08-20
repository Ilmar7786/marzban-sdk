import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<RemoveUserTemplatePathParams>

export type RemoveUserTemplatePathParamsSchema = RemoveUserTemplatePathParams

/**
 * @description Successful Response
 */
export const removeUserTemplate200Schema = z.any() as unknown as ToZod<RemoveUserTemplate200>

export type RemoveUserTemplate200Schema = RemoveUserTemplate200

/**
 * @description Validation Error
 */
export const removeUserTemplate422Schema = HTTPValidationErrorSchema as unknown as ToZod<RemoveUserTemplate422>

export type RemoveUserTemplate422Schema = RemoveUserTemplate422

export const removeUserTemplateMutationResponseSchema =
  removeUserTemplate200Schema as unknown as ToZod<RemoveUserTemplateMutationResponse>

export type RemoveUserTemplateMutationResponseSchema = RemoveUserTemplateMutationResponse
