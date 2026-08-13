# ADR-0010: MCP — stdio only, env-only config, profile + confirm security model

Status: Accepted
Date: 2026-08

## Context

`packages/mcp` exposes Marzban panel operations — including destructive
ones like restarting the core or deleting a user — to an AI model. MCP
clients typically launch the server as a subprocess and configure it
through their own config file, not through arbitrary runtime input.

## Decision

- Transport is stdio only, no HTTP mode.
- Credentials and `baseUrl` are read only from environment variables, never
  from tool call arguments — a model can't be prompted or tricked into
  supplying its own target panel.
- Tools declare a `scope` (`read` / `write` / `destructive`); a deployment
  picks a `profile` (`readonly` / `standard` / `full`) that determines which
  scopes are exposed, further narrowed by allow/deny glob lists.
- Destructive tools additionally require a short-lived confirmation token
  (hash of the exact arguments, TTL, single use) unless the operator sets
  `MARZBAN_MCP_CONFIRM=off`.

## Consequences

- A misconfigured or malicious prompt cannot redirect the server at a
  different panel or exfiltrate credentials through tool arguments — the
  attack surface for that is closed at the config layer.
- Deploying with `profile: readonly` gives a hard guarantee (enforced at
  tool registration, not just by convention) that no write or destructive
  tool is even registered.
- The confirmation mechanism adds a round-trip for destructive actions —
  accepted cost for the operations that can restart the core or delete
  users.
