/** Extracts a WS error event's message, defaulting to `''` when absent (mirrors the browser `ErrorEvent` shape). */
export const getWsErrorMessage = (event: WebSocketEventMap['error']): string =>
  (event as Event & { message: string }).message || ''

/**
 * The `ws` package is the only transport that reports the rejected
 * handshake's HTTP status, and only through this exact error message — the
 * native `WebSocket` (browsers, Deno, Bun, Node 21+) reports an empty message
 * and a synthetic close code `1006`, the same as for every other pre-open
 * failure (see ADR-0006's consequence, recorded in ADR-0016).
 *
 * Deliberately anchored to that one phrase rather than "any 3-digit number in
 * the message": a connection-refused error reads
 * `connect ECONNREFUSED 127.0.0.1:53467`, and a looser pattern would read the
 * port as a status — turning "the panel is restarting" into "the panel
 * rejected us", which is exactly the misclassification this module must avoid.
 */
const UNEXPECTED_RESPONSE = /unexpected server response:\s*(\d{3})/i

/**
 * The HTTP status of a rejected WebSocket handshake, when the transport
 * reported one — `undefined` whenever the failure is structurally ambiguous
 * (native transport, connection refused, DNS failure, connect timeout).
 *
 * A defined status is the only positive evidence the panel actively refused
 * the connection, so it's what gates terminal handling: everything else is
 * treated as a transient transport failure and retried within the reconnect
 * budget (see {@link LogStream}).
 */
export const extractWsHandshakeStatus = (message: string): number | undefined => {
  const match = UNEXPECTED_RESPONSE.exec(message)
  return match ? Number(match[1]) : undefined
}
