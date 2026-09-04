export interface FormatCode {
  code: string
  message: string
}

export const ERROR_CODES = {
  CONFIG_INVALID: { code: 'CONFIG_INVALID', message: 'Invalid SDK configuration' },

  SDK_DESTROYED: { code: 'SDK_DESTROYED', message: 'The SDK instance has been destroyed' },

  NETWORK_HTTP_ERROR: { code: 'NETWORK_HTTP_ERROR', message: 'HTTP request failed' },

  AUTH_TOKEN_FAILED: { code: 'AUTH_TOKEN_FAILED', message: 'Failed to retrieve access token' },
  AUTH_FAILED: { code: 'AUTH_FAILED', message: 'Authentication failed' },

  LOGGER_INVALID: {
    code: 'LOGGER_INVALID',
    message: 'Invalid logger option: must be false, LoggerOptions, or Logger instance',
  },

  WS_OPTIONS_INVALID: { code: 'WS_OPTIONS_INVALID', message: 'Invalid WebSocket log stream options' },
  WS_HANDSHAKE_REJECTED: {
    code: 'WS_HANDSHAKE_REJECTED',
    message: 'The WebSocket handshake was rejected before the connection ever opened',
  },
  WS_AUTH_FAILED: {
    code: 'WS_AUTH_FAILED',
    message: 'WebSocket re-authentication failed with a freshly issued token',
  },
  WS_CONNECTION_LOST: { code: 'WS_CONNECTION_LOST', message: 'The WebSocket connection was lost after opening' },
  WS_RETRIES_EXHAUSTED: {
    code: 'WS_RETRIES_EXHAUSTED',
    message: 'The WebSocket reconnect budget was exhausted',
  },

  WEBHOOK_SIGNATURE_ERROR: { code: 'WEBHOOK_SIGNATURE_ERROR', message: 'Invalid webhook signature' },
  WEBHOOK_VALIDATION_ERROR: { code: 'WEBHOOK_VALIDATION_ERROR', message: 'Invalid webhook payload' },
  WEBHOOK_ENVIRONMENT_ERROR: {
    code: 'WEBHOOK_ENVIRONMENT_ERROR',
    message:
      'Webhook signature verification is not supported in the browser. ' +
      'Handle webhooks on a server-side runtime (Node.js, Bun, Deno, or an edge/worker runtime) so the secret is never exposed to clients.',
  },
} as const satisfies Record<string, FormatCode>

export type ErrorMap = typeof ERROR_CODES
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]['code']
