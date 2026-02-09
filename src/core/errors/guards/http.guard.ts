import { HttpError } from '../categories'

export const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError
}
