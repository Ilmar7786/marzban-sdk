# ADR-0003: Vendor and hand-patch the OpenAPI spec

Status: Accepted
Date: 2026-08-12

## Context

The upstream Marzban OpenAPI spec is imprecise in places — some objects are
declared with no `properties` (e.g. proxy settings, parts of the core
config), which kubb generates as `z.object({})`. In Zod's default strip
mode, parsing any real payload against that schema silently drops every key.
`getCoreConfig()`/`modifyCoreConfig()` and `proxies` fields were returning
empty objects.

## Decision

Vendor `packages/sdk/openapi/openapi.json` in the repo rather than fetching
it at build time, and hand-patch the specific under-specified schemas with
`additionalProperties: true` so kubb emits `.catchall(z.any())` for them
instead of a key-dropping strict object.

## Consequences

- The spec is a maintained artifact, not a passthrough — patches must be
  re-applied if the spec is ever re-vendored wholesale from upstream.
- `packages/sdk/src/gen-regression.test.ts` pins the specific schemas this
  affects (`ProxySettings`, core config get/put, `proxies` on user
  responses) so a future spec update that silently reverts the patch fails
  the test suite instead of shipping silently-truncated data.
