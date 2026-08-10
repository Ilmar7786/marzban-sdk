import type { ValidationError } from './ValidationError.ts'

/**
 * HTTPValidationError
 */
export type HTTPValidationError = {
  /**
   * @type array | undefined
   */
  detail?: ValidationError[]
}
