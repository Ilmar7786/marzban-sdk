import { WebhookEnvironmentError, WebhookSignatureError, WebhookValidationError } from '../categories'

export const isWebhookSignatureError = (error: unknown): error is WebhookSignatureError => {
  return error instanceof WebhookSignatureError
}

export const isWebhookValidationError = (error: unknown): error is WebhookValidationError => {
  return error instanceof WebhookValidationError
}

export const isWebhookEnvironmentError = (error: unknown): error is WebhookEnvironmentError => {
  return error instanceof WebhookEnvironmentError
}
