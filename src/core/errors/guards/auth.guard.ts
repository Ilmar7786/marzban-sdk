import { AuthError } from '../categories'

export const isAuthError = (error: unknown): error is AuthError => {
  return error instanceof AuthError
}
