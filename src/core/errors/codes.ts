export interface FormatCode {
  code: string
  message: string
}

export const ERROR_CODES: Record<string, FormatCode> = {
  CONFIG_INVALID: { code: 'CONFIG_INVALID', message: 'Invalid SDK configuration' },
  PLUGIN_EXECUTION: { code: 'PLUGIN_EXECUTION', message: 'Plugin execution failed' },

  NETWORK_ERROR: { code: 'NETWORK_ERROR', message: 'Network request failed' },
  NETWORK_HTTP_ERROR: { code: 'NETWORK_HTTP_ERROR', message: 'HTTP request failed' },
  NETWORK_WS_ERROR: { code: 'NETWORK_WS_ERROR', message: 'WebSocket connection failed' },

  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
  LOGGER_INIT_ERROR: { code: 'LOGGER_INIT_ERROR', message: 'Logger initialization failed' },

  AUTH_TOKEN_FAILED: { code: 'AUTH_TOKEN_FAILED', message: 'Failed to retrieve access token' },
  AUTH_FAILED: { code: 'AUTH_FAILED', message: 'Authentication failed' },

  LOGGER_INVALID: {
    code: 'LOGGER_INVALID',
    message: 'Invalid logger option: must be false, LoggerOptions, or Logger instance',
  },
} as const
