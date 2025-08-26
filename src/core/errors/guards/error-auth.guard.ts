import { AuthError } from '../categories'

export const isErrorAuth = (error: unknown): error is AuthError => {
  return error instanceof AuthError
}
