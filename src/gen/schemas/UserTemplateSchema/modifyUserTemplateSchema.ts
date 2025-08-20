import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<ModifyUserTemplatePathParams>

export type ModifyUserTemplatePathParamsSchema = ModifyUserTemplatePathParams

/**
 * @description Successful Response
 */
export const modifyUserTemplate200Schema = userTemplateResponseSchema as unknown as ToZod<ModifyUserTemplate200>

export type ModifyUserTemplate200Schema = ModifyUserTemplate200

/**
 * @description Validation Error
 */
export const modifyUserTemplate422Schema = HTTPValidationErrorSchema as unknown as ToZod<ModifyUserTemplate422>

export type ModifyUserTemplate422Schema = ModifyUserTemplate422

export const modifyUserTemplateMutationRequestSchema =
  userTemplateModifySchema as unknown as ToZod<ModifyUserTemplateMutationRequest>

export type ModifyUserTemplateMutationRequestSchema = ModifyUserTemplateMutationRequest

export const modifyUserTemplateMutationResponseSchema =
  modifyUserTemplate200Schema as unknown as ToZod<ModifyUserTemplateMutationResponse>

export type ModifyUserTemplateMutationResponseSchema = ModifyUserTemplateMutationResponse
