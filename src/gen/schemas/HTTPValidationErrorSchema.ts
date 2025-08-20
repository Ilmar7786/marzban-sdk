import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { HTTPValidationError } from '../models/HTTPValidationError.ts'
import { validationErrorSchema } from './validationErrorSchema.ts'

export const HTTPValidationErrorSchema = z.object({
  get detail() {
    return z.array(validationErrorSchema).optional()
  },
}) as unknown as ToZod<HTTPValidationError>

export type HTTPValidationErrorSchema = HTTPValidationError
