/**
 * Options for WebSocket URL configuration
 */
export interface WebSocketUrlOptions {
  /** Base path for the WebSocket connection */
  basePath: string
  /** API endpoint for the WebSocket */
  endpoint: string
  /** Authentication token */
  token: string
  /** Interval for message polling (in seconds) */
  interval: string | number
}

/**
 * Creates a WebSocket URL with proper protocol and query parameters
 *
 * @param options - Configuration options for the WebSocket URL
 * @returns Formatted WebSocket URL string
 *
 * @example
 * ```typescript
 * const wsUrl = configurationUrlWs({
 *   basePath: 'https://api.example.com',
 *   endpoint: '/api/core/logs',
 *   token: 'jwt-token',
 *   interval: 1
 * })
 * // Returns: 'wss://api.example.com/api/core/logs?interval=1&token=jwt-token'
 * ```
 */
export const configurationUrlWs = ({ basePath, endpoint, token, interval }: WebSocketUrlOptions): string => {
  const url = new URL(basePath)
  const wsProtocol = url.protocol === 'https:' ? 'wss' : 'ws'

  url.protocol = wsProtocol
  url.pathname = endpoint
  url.searchParams.set('interval', interval.toString())
  url.searchParams.set('token', token)

  return url.toString()
}
