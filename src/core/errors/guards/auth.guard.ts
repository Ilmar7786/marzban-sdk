import { AuthError, AuthTokenError } from '../categories'

export const isAuthError = (error: unknown): error is AuthError => {
  return error instanceof AuthError
}

export const isAuthTokenError = (error: unknown): error is AuthTokenError => {
  return error instanceof AuthTokenError
}
