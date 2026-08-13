# ADR-0007: Plugin system removed

Status: Accepted
Date: 2026-02-09

## Context

A plugin system was built to let consumers extend SDK behavior: a plugin
manager, registry, HTTP interceptor hooks, a storage layer, two example
plugins, and supporting documentation (~2000 lines total). It required
`MarzbanSDK` construction to become async and introduced its own type and
validation conflicts, which needed several follow-up fixes (lazy loading,
context type conflicts, async initialization ordering). Six months in, the
only plugins that existed were the two shipped as examples.

## Decision

Remove the plugin system entirely — manager, registry, interceptors,
storage, examples, and docs.

## Consequences

- Removed ~1000 lines of infrastructure and its ongoing maintenance cost for
  a capability with no real usage.
- The async factory function (`createMarzbanSDK`) that the plugin system
  required survived its removal and became the SDK's permanent, recommended
  construction path — see
  [ADR-0005](./0005-single-entry-public-api.md).
- If extensibility is needed again, this ADR is the record of why the first
  attempt was cut: build it only once a concrete extension actually needs
  it, not speculatively.
