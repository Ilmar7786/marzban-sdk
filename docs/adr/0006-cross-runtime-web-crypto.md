# ADR-0006: Cross-runtime SDK — Web Crypto, native WebSocket, `Uint8Array`

Status: Accepted
Date: 2026-06-22

## Context

The SDK is meant to run identically in Node.js and the browser. Webhook
signature verification statically imported `node:crypto`, which bundlers
pulled into browser builds regardless of whether webhooks were used there.
`Buffer`-based APIs and identity-based runtime checks (`typeof window`, that
sort of thing) carried the same assumption that Node was the only target.

## Decision

Replace `node:crypto` with the Web Crypto API (`globalThis.crypto.subtle`),
which is available in both environments — this made webhook verification
async. Replace `Buffer` usage with `Uint8Array`. Replace identity-based
runtime checks with capability checks (does `globalThis.crypto.subtle`
exist?, not what platform is this?). Prefer the native global `WebSocket`
where present, lazy-importing the `ws` package only as a Node fallback.

## Consequences

- Breaking change (`v3.0.0`) — `parseWebhook`/`verifyWebhookSignature` went
  from sync to async.
- Webhook verification in a browser context is now explicitly rejected
  (`WebhookEnvironmentError`) rather than silently attempted — a webhook
  secret should never reach client-side code.
- No conditional bundler exports or environment-specific entry points were
  needed — the same code path works everywhere because it only checks
  capabilities.
