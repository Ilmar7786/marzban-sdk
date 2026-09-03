import { SdkDestroyedError } from './errors'

/**
 * Shared terminal-state flag for one `MarzbanSDK` instance. `MarzbanSDK.destroy()`
 * calls {@link markDestroyed} once; every subsystem it owns (`AuthManager`,
 * `LogsStream`, `WebhookManager`) holds the same instance instead of a private
 * flag, and calls {@link assertActive} — typically right after an `await`,
 * where a pending operation could otherwise resurrect work post-shutdown.
 */
export class Lifecycle {
  private _destroyed = false

  get destroyed(): boolean {
    return this._destroyed
  }

  markDestroyed(): void {
    this._destroyed = true
  }

  /** @throws {SdkDestroyedError} If `markDestroyed()` has already been called. */
  assertActive(operation: string): void {
    if (this._destroyed) {
      throw new SdkDestroyedError(operation)
    }
  }
}
