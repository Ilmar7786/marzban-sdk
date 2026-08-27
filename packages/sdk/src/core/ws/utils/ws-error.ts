/** Extracts a WS error event's message, defaulting to `''` when absent (mirrors the browser `ErrorEvent` shape). */
export const getWsErrorMessage = (event: WebSocketEventMap['error']): string =>
  (event as Event & { message: string }).message || ''

/**
 * The panel collapses an expired/invalid token, a non-sudo admin, and an
 * out-of-range `interval` into one generic HTTP 403 on the handshake (see
 * docs/marzban-quirks.md) — this is the only signal the client gets.
 */
export const isForbiddenWsError = (message: string): boolean => message.includes('403')
