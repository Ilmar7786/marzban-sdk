/**
 * Cross-runtime environment detection.
 *
 * The SDK runs in browsers, Node.js, Bun, Deno, and edge runtimes (e.g.
 * Cloudflare Workers). Centralizing these capability checks keeps platform
 * branching consistent, testable, and free of brittle `window`-only guards.
 *
 * Note: prefer *capability* checks (does this global exist?) over *identity*
 * checks (which runtime is this?). Capabilities are stable across runtimes and
 * versions; identity is not.
 */

/**
 * True when running in a browser-like main thread.
 *
 * Requires both `window` and `document`, so it stays false in Web Workers,
 * Node, Deno, Bun, and edge runtimes — even those that expose a `window`-like
 * global.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof (window as { document?: unknown }).document !== 'undefined'
}

/**
 * True when a native `WebSocket` implementation is exposed on the global scope.
 *
 * Covers browsers, Web Workers, Deno, Bun, and Node.js 21+. When this returns
 * false (older Node), the SDK falls back to the `ws` package.
 */
export function hasNativeWebSocket(): boolean {
  return typeof globalThis.WebSocket === 'function'
}

/**
 * True when running outside an explicit production environment.
 *
 * Reads `process.env.NODE_ENV` when available (Node.js, Bun, and most bundlers,
 * which inline it for browser builds). Anything other than `'production'` is
 * treated as development. When `process` is unavailable (some browser/Worker
 * runtimes) we cannot tell, so we assume production — the quieter, safer default.
 */
export function isDevEnvironment(): boolean {
  if (typeof process === 'undefined' || !process.env) {
    return false
  }
  return process.env.NODE_ENV !== 'production'
}

/**
 * Returns the global {@link SubtleCrypto} implementation (Web Crypto API).
 *
 * Available in browsers, Web Workers, Node.js 19+, Bun, Deno, and edge
 * runtimes — without importing any `node:`-specific module, so it never leaks
 * into browser bundles.
 *
 * @throws {Error} When the Web Crypto API is unavailable in the current runtime.
 */
export function getSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error(
      'Web Crypto API (globalThis.crypto.subtle) is not available in this runtime. ' +
        'Node.js 19+ or a modern browser/Bun/Deno runtime is required for webhook signature verification.'
    )
  }
  return subtle
}
