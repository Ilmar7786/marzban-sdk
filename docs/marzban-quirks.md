# Marzban quirks

**Covers:** behavioral quirks in the real Marzban panel itself — verified by
hand and by the integration suites (see [testing.md](./testing.md)) — that
this repo's code, tests, or docs work around. A running list, expected to
grow as more of the API gets integration-tested.
**Excludes:** inaccuracies in Marzban's OpenAPI _spec_ (as opposed to its
runtime behavior) — those are patched in the vendored spec, see
[ADR-0003](./adr/0003-vendored-openapi-spec.md). Bugs in our own code — track
those as GitHub issues, not here.
**Next:** [testing.md](./testing.md) for how the integration suites that
found these are run.

Each entry: what happens, where it was verified, why (if known), where the
workaround lives, and what's still open. Nothing here is fixed by us — these
are Marzban's behavior; we document and work around them defensively.

## `DELETE /api/user/{username}` 500s despite deleting the user

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

The server removes the user row, then crashes building the deletion report —
`Admin.model_validate(dbuser.admin)` on `None` (the user has no owning
admin), in Marzban's `app/routers/user.py` `remove_user` — before it can
send a response. The delete is not lost; only the HTTP response is. Confirm
the outcome with a follow-up `GET` (404), not by the delete call resolving.

**Workaround:** `removeUserTolerantly()` in
[`packages/sdk/test/integration/helpers/quirks.ts`](../packages/sdk/test/integration/helpers/quirks.ts)
and the mirrored helper in
[`packages/mcp/test/integration/helpers/quirks.ts`](../packages/mcp/test/integration/helpers/quirks.ts)
— catches exactly a 500 from `removeUser` and treats it as success.

**Open:** the SDK itself does not currently special-case this — a real
caller of `sdk.user.removeUser()` against an affected Marzban version still
sees an `HttpError` on a successful delete. Worth deciding whether that
tolerance belongs in the SDK proper (and, if so, how narrowly to scope it so
a _genuine_ 500 elsewhere isn't silently swallowed) or stays test-only.

## The 500 above can poison the next request on the same connection

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`, via the
SDK's pooled axios/Node `https` agent — not reproducible with one-shot
`curl` calls, which don't reuse a connection.

The crash above leaves the pooled keep-alive socket in a bad state; the
_next_ request that reuses that same connection (even an unrelated plain
`GET`) fails with a spurious `ECONNRESET` / "socket hang up" before it
reaches the server.

**Workaround:** `freshConnectionConfig()` in both `quirks.ts` files above —
a one-off `httpsAgent` per call for any request made immediately after
`removeUser`/`removeUserTolerantly`, so it can't draw the poisoned socket
from the shared pool.

**Open:** only worked around at the test level. Not something the SDK can
reasonably detect and self-heal from (an `ECONNRESET` is indistinguishable
from any other transient network failure). `axios-retry`'s default retries
did not recover it in practice — worth understanding why, if this turns out
to affect real deployments and not just this dev image.

## `addUser` requires a non-empty `proxies`

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

Omitting `proxies` entirely 500s server-side ("Each user needs at least one
proxy"). An empty per-protocol settings object is accepted and auto-filled —
e.g. `{ shadowsocks: {} }` gets a generated `password`/`method` back.
Requesting a protocol with no matching Xray inbound configured on the panel
is rejected too ("Protocol ProxyTypes.X is disabled on your server").

**Workaround:** none needed beyond knowing this — integration tests always
pass at least one proxy protocol that has a matching inbound (see
`SHADOWSOCKS_PROXY` in
[`packages/sdk/test/integration/users.integration.test.ts`](../packages/sdk/test/integration/users.integration.test.ts),
matching the one inbound `local/marzban/`'s bundled `xray_config.json`
ships).

## `data_limit: 0` / `expire: 0` on create come back as `null`

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

Both `0` values mean "unlimited" in the request; Marzban normalizes the wire
representation to `null` in the response rather than echoing back `0`.

**Workaround:** none needed — SDK types already allow `null`; just don't
assert the response echoes the request verbatim for these two fields.

## A past `expire` does not synchronously flip `status` to `expired`

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

Creating (or modifying) a user with an already-past `expire` leaves
`status: 'active'` in the response and on an immediate follow-up `GET`.
`status` only catches up when some other operation runs (observed: a
`revoke_sub` call flipped it), or presumably a background job — not
deterministically on read.

**Workaround:** none needed at the SDK level — this is exactly why
`usersGetTool`'s `summarizeUser`/`isEffectivelyExpired` in
[`packages/mcp/src/modules/users/users.tools.ts`](../packages/mcp/src/modules/users/users.tools.ts)
computes expiry client-side instead of trusting `status` alone. Integration
tests assert the lag explicitly rather than assuming a fresh `GET` reflects
an already-past `expire`.

**Also affects:** `GET /api/users/expired` and `DELETE /api/users/expired`
filter by the (lazily-updated) `status` column, not the raw `expire`
timestamp — a user created with a past `expire` moments ago does not show
up in either call yet. `revoke_sub` is the cheapest confirmed way to force
the recalculation on demand; see
[`users-bulk.integration.test.ts`](../packages/sdk/test/integration/users-bulk.integration.test.ts).

## `activeNextPlan` 404s with "User doesn't have next plan" even when it applies the plan

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

`POST /api/user/{username}/active-next` on a user with a queued `next_plan`
reliably responds `404 {"detail": "User doesn't have next plan"}` — but a
follow-up `GET` shows `data_limit`/`expire` already updated to the queued
plan's values and `next_plan` cleared. The plan was applied; only the HTTP
response claims otherwise. Same shape as the `DELETE /api/user` 500 quirk
above. Separately, `next_plan.add_remaining_traffic: true` was observed to
replace `data_limit` outright with the next plan's value; `false` was
observed to **sum** the old and new `data_limit` instead of leaving the old
value out, the opposite of what the flag name suggests — not fully
characterized, and not asserted on by the integration suite.

**Workaround:** confirm the outcome via a follow-up `GET`, not via this
call resolving — see
[`users-lifecycle.integration.test.ts`](../packages/sdk/test/integration/users-lifecycle.integration.test.ts).

**Open:** same as `removeUser` above — the SDK doesn't special-case this;
a real caller sees an `HttpError` on a successful activation. The
`add_remaining_traffic` semantics are worth a closer look before anyone
relies on them.
