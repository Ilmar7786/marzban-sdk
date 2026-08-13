# ADR-0004: Classed generated API clients with injected HTTP client

Status: Accepted
Date: 2026-05-19

## Context

Generated operations were free functions that closed over a single global
axios instance. Any process creating more than one `MarzbanSDK` instance had
them silently share one HTTP client — including its auth state.

## Decision

Configure kubb's client plugin with `clientType: 'class'`, so each generated
`*Api` (e.g. `nodeApi`, `userApi`) is a class whose constructor takes a
`client`. `MarzbanSDK` builds one HTTP client per instance and injects it
into each API class it constructs (`this.node = new nodeApi({ client })`).

## Consequences

- Multiple SDK instances in one process are now fully isolated — separate
  auth state, separate retry configuration.
- Wiring each module's class to the facade by hand became the one manual
  step per module in an otherwise generated pipeline — see
  [`packages/sdk/ARCHITECTURE.md`](../../packages/sdk/ARCHITECTURE.md).
- A now-removed workaround (`core/http/bind-client-to-api.ts`) was deleted
  in the same change — it existed only to patch around the free-function
  client-binding problem this decision solves directly.
