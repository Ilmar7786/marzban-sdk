export interface FormatCode {
  code: string
  message: string
}

export const ERROR_CODES = {
  CONFIG_INVALID: { code: 'CONFIG_INVALID', message: 'Invalid SDK configuration' },

  NETWORK_HTTP_ERROR: { code: 'NETWORK_HTTP_ERROR', message: 'HTTP request failed' },

  AUTH_TOKEN_FAILED: { code: 'AUTH_TOKEN_FAILED', message: 'Failed to retrieve access token' },
  AUTH_FAILED: { code: 'AUTH_FAILED', message: 'Authentication failed' },

  LOGGER_INVALID: {
    code: 'LOGGER_INVALID',
    message: 'Invalid logger option: must be false, LoggerOptions, or Logger instance',
  },

  WEBHOOK_SIGNATURE_ERROR: { code: 'WEBHOOK_SIGNATURE_ERROR', message: 'Invalid webhook signature' },
  WEBHOOK_VALIDATION_ERROR: { code: 'WEBHOOK_VALIDATION_ERROR', message: 'Invalid webhook payload' },
} as const satisfies Record<string, FormatCode>

export type ErrorMap = typeof ERROR_CODES
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]['code']
