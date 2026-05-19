import type { ValidationError } from './ValidationError.ts'

export type HTTPValidationError = {
  /**
   * @type array | undefined
   */
  detail?: ValidationError[]
}
