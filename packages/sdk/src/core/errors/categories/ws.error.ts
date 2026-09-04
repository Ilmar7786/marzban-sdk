import { redactUrlToken } from '@/common'

import { ERROR_CODES, FormatCode } from '../codes'
import { SdkError } from '../sdk.error'

export class WsOptionsError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.WS_OPTIONS_INVALID, details)
  }
}

/** Which phase of a WebSocket stream's lifecycle a {@link WsError} was raised in. */
export type WsErrorPhase = 'handshake' | 'connection'

export interface WsErrorDetails {
  /** `'handshake'` for a failure before the socket ever reached `open`; `'connection'` for a drop after it did. */
  phase: WsErrorPhase
  /** 1-based attempt number within the current phase (handshake retry, or reconnect attempt). */
  attempt: number
  /** The WebSocket URL involved — the `token` query parameter is redacted by this constructor. */
  url: string
  /** WebSocket close code, when the failure arrived as a `close` event. */
  closeCode?: number
  /**
   * HTTP status of a rejected handshake, when known. Per docs/marzban-quirks.md,
   * the panel collapses every pre-`accept()` rejection into a generic `403` —
   * this is usually `403` regardless of the underlying cause.
   */
  status?: number
  /** The raw error/close event that triggered this, redacted like the rest of `details`. */
  event?: unknown
}

/**
 * Raised by the WS log-streaming module (`core/ws`) instead of forwarding a
 * raw DOM `Event`/`CloseEvent` — see ADR-0016.
 */
export class WsError extends SdkError<WsErrorDetails> {
  constructor(code: FormatCode, details: WsErrorDetails) {
    super(code, { ...details, url: redactUrlToken(details.url, 'token') })
  }

  get phase(): WsErrorPhase {
    return this.details!.phase
  }

  get attempt(): number {
    return this.details!.attempt
  }

  get url(): string {
    return this.details!.url
  }

  get closeCode(): number | undefined {
    return this.details?.closeCode
  }

  get status(): number | undefined {
    return this.details?.status
  }
}
