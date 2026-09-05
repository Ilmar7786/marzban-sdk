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

**Verified against:** `gozargah/marzban:v0.8.4` (both the pinned tag and
current `master` on GitHub have byte-identical code — this is not fixed
upstream), `local/marzban/` (reproduced from a freshly recreated container,
empty DB).

The server removes the user row, then crashes building the deletion report —
`Admin.model_validate(dbuser.admin)` on `None` — in Marzban's
`app/routers/user.py` `remove_user`, before it can send a response:

```python
def remove_user(...):
    crud.remove_user(db, dbuser)                       # delete already committed
    bg.add_task(xray.operations.remove_user, dbuser=dbuser)
    bg.add_task(
        report.user_deleted, username=dbuser.username,
        user_admin=Admin.model_validate(dbuser.admin),  # raises here, synchronously
        by=admin
    )
    return {"detail": "User successfully deleted"}      # never reached
```

`bg.add_task(fn, *args)`'s arguments are evaluated immediately (it's a plain
function call) — the crash happens inside the endpoint body itself, not in
the deferred background task. The delete is not lost; only the HTTP response
is. Confirm the outcome with a follow-up `GET` (404), not by the delete call
resolving.

**Concrete repro (primary path — no second admin needed):** `dbuser.admin`
is `None` whenever the user's `admin_id` doesn't resolve to a live `Admin`
row. The most common way to land there: the env-configured sudo admin
(`SUDO_USERNAME`/`SUDO_PASSWORD`) has **no row in the `admins` table at
all** — `Admin.get_admin()` (`app/models/admin.py`) short-circuits and
builds a Pydantic `Admin` straight from the JWT payload when the token's
username is in `SUDOERS`, never touching the DB. `add_user`
(`app/routers/user.py`) then does `admin=crud.get_admin(db,
admin.username)` — a plain DB lookup by username — which returns `None` for
that admin. So **any user created by the default env sudo login already has
`admin_id: null` from the moment it's created** (confirmed via `GET
/api/user/{username}` showing `"admin": null` right after creation, no
extra step). `DELETE`ing it then 500s as above. This is why the bug is
"reliable" in the integration suite: it authenticates as exactly that env
sudo admin.

**Secondary path (also verified, needs two admins):** a non-sudo admin
(created through the API, so it _does_ have an `admins` row) creates a
user → the user's `admin_id` points at that admin; a sudo admin later
deletes it (`DELETE /api/admin/{username}`) — there's no `ON DELETE SET
NULL`/cascade, so `dbuser.admin` stops resolving on the next read. Same
symptom, different route to it. Either way, this isn't an edge case scoped
to unusual setups — it's the default outcome of the single most common
setup (one env-configured sudo admin managing its own users directly).

**Workaround:** `sdk.user.removeUser()` in `packages/sdk` catches exactly a
500 from this endpoint and confirms the delete via a follow-up `getUser`
(expecting 404) before treating it as success — see
[`TolerantUserApi`](../packages/sdk/src/core/quirks/tolerant-user-api.ts). A
genuine failure (the follow-up `getUser` shows the user still exists, or
the confirmation itself can't be made) still throws. The integration
suite's own `removeUserTolerantly()` in
[`packages/sdk/test/integration/helpers/quirks.ts`](../packages/sdk/test/integration/helpers/quirks.ts)
and the mirrored helper in
[`packages/mcp/test/integration/helpers/quirks.ts`](../packages/mcp/test/integration/helpers/quirks.ts)
now just call `sdk.user.removeUser()` directly — the tolerance itself moved
into the SDK, and the wrapper only remains to add
[`freshConnectionConfig()`](../packages/sdk/test/integration/helpers/quirks.ts)
(a one-off connection), so that the SDK's own internal confirmation call
doesn't draw the poisoned socket left behind by the crash.

Resolved in [issue #103](https://github.com/Ilmar7786/marzban-sdk/issues/103),
shipping in `sdk-v3.3.0`.

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

Only worked around at the test level — not something the SDK can reasonably
detect and self-heal from (an `ECONNRESET` is indistinguishable from any
other transient network failure).

`axios-retry`'s default retries didn't recover it because they weren't
running at all: a since-fixed bug had retries on the authenticated client
silently never fire for any method or error (see the SDK changelog, v3.2.0).
Now that they do, a `GET` hitting this can be retried — though a retry may
still draw the same poisoned connection from the pool, so
`freshConnectionConfig()` stays necessary.

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

## `modifyHosts` merges by inbound tag — it does not replace the whole map

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

Both this repo's docs (`apps/docs/content/docs/modules/system.mdx`) and a
first read of `PUT /api/hosts` describe it as replacing "the existing
config", which reads as whole-map replace — PUT semantics, omitted tag
gone. That's not what happens: a tag **omitted** from the request body is
left completely untouched. `PUT /api/hosts` with `{}` is a no-op — the
response and the following `GET` both echo the panel's existing host map
unchanged. Only tags **present** in the payload are touched; a present tag
with an empty array (`{ "<tag>": [] }`) does clear that tag's hosts.

**Workaround:** none needed once known — don't assume an empty or partial
`modifyHosts` payload wipes anything not explicitly listed. To actually
clear a tag, list it with `[]`; see
[`system-hosts.integration.test.ts`](../packages/sdk/test/integration/system-hosts.integration.test.ts).

**Open:** whether this holds for a panel with multiple inbounds/tags the
same way it does for `local/marzban/`'s single Shadowsocks inbound is
untested — only one tag exists to probe against here.

## `modifyCoreConfig`/`modifyHosts` reject structurally invalid input with 400, not 422

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

Both `coreApi.ts`'s and `systemApi.ts`'s generated error unions declare 422
(`HTTPValidationError`) for these mutations (a FastAPI/Pydantic
convention), but the panel actually rejects a structurally invalid write —
an empty core config (`{}`, "config doesn't have inbounds") or a
`modifyHosts` payload keyed by an inbound tag that doesn't exist ("Inbound
&lt;tag&gt; doesn't exist") — with a **400**, not a 422. In both cases the
write does not land; a follow-up `GET` confirms the prior state is
unchanged.

**Workaround:** none needed — `HttpError.status` still carries the real
code; just don't assert 422 for these specific bad-input shapes. See
[`core.integration.test.ts`](../packages/sdk/test/integration/core.integration.test.ts)
and
[`system-hosts.integration.test.ts`](../packages/sdk/test/integration/system-hosts.integration.test.ts).

**Open:** not exhaustively characterized — other malformed shapes (e.g. a
core config with a syntactically valid but semantically broken inbound)
might still hit the documented 422 path. Only the two specific cases above
were verified.

## `addUserTemplate` rejects an omitted/null `name` with 409, even against an empty template list

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

Every field on `UserTemplateCreate` is optional, and `addUserTemplate({})`
type-checks fine — but the panel always rejects it with `409 "Template by
this name already exists"`, reproducibly, even when `getUserTemplates()`
returns an empty array. It isn't a real name collision; a `null`/omitted
name apparently can't be created at all.

**Workaround:** none needed once known — always pass a `name` to
`addUserTemplate`. See
[`user-template.integration.test.ts`](../packages/sdk/test/integration/user-template.integration.test.ts).

**Open:** whether this is intentional (uniqueness check comparing `NULL` to
itself) or a panel bug wasn't investigated further.

## `addUserTemplate`/`modifyUserTemplate` silently drop inbound tags that don't match a real inbound

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

Unlike `addUser` (which 500s for a protocol with no matching inbound — see
above), a template's `inbounds` dictionary is filtered, not validated: an
unknown inbound tag is silently dropped from the stored/returned value, no
error. A protocol key whose only tag(s) were all unknown disappears from
`inbounds` entirely rather than coming back as an empty array.

**Workaround:** none needed — don't assume a template's `inbounds` in the
response mirrors what you sent; read it back. See
[`user-template.integration.test.ts`](../packages/sdk/test/integration/user-template.integration.test.ts).

**Open:** not tested against a panel with more than one real inbound tag —
only confirmed that a single bogus tag is dropped and a single valid tag
alongside it survives.

## `UserTemplate`'s `data_limit`/`expire_duration` are not normalized from `0` to `null`, unlike `User`

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

The "`data_limit: 0` / `expire: 0` on create come back as `null`" quirk
above is specific to `addUser`/`modifyUser`. `addUserTemplate({ data_limit:
0, expire_duration: 0, ... })` echoes back literal `0`s, not `null` — both
still mean "unlimited"/"no expiry" semantically (per the JSDoc on
`addUserTemplate`), just represented differently on the wire than the User
module.

**Workaround:** none needed — just don't generalize the User module's 0→null
normalization to templates.

## `revokeUserSubscription` does not change the subscription token — only the proxy credentials

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

`subscription_url` (and the `/sub/{token}` token embedded in it) is a
stable, deterministic value for the lifetime of a user — repeated reads
return the byte-identical string every time, and so does
`revokeUserSubscription()`'s own response. "Revoke" only rotates what's
_behind_ the token: the proxy credentials (see
`users.integration.test.ts`'s "revoking a subscription rotates the proxy
credentials"). The subscription link itself keeps working, now serving the
rotated credentials — it never needs to be re-shared with the end user
after a revoke.

**Workaround:** none needed — don't assume `revokeUserSubscription()`
invalidates a previously-issued subscription link; it doesn't, by design.
See
[`subscription.integration.test.ts`](../packages/sdk/test/integration/subscription.integration.test.ts).

## `removeNode` deletes the node but leaves its auto-added host behind

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

`addNode({ add_as_new_host: true })` (the default) adds a proxy host entry
for the node under its inbound tag, with `remark` containing the node's
name and `address` set to the node's address. `removeNode` deletes the node
row but does not remove that host entry — it's left in the host map,
pointing at an address that no longer resolves to any node, until removed
manually via `modifyHosts`.

**Workaround:** none needed at the SDK level — a caller that creates a node
with `add_as_new_host: true` and later removes it should also clean up the
corresponding host entry itself. See
[`node-hosts.integration.test.ts`](../packages/sdk/test/integration/node-hosts.integration.test.ts),
which restores the host map from a snapshot in `afterAll` rather than
relying on `removeNode` to have cleaned up after itself.

**Open:** not tested against a panel with more than one inbound tag, or
against `add_as_new_host: false` followed by a separate manual host add —
only the default create-then-remove path was verified.

## `addNode` fires an async connection attempt immediately, which can race a follow-up `modifyNode`

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`, panel
container logs (`INFO: Connecting to "<name>" node` /
`INFO: Unable to connect to "<name>" node`).

`addNode` schedules a background task that tries to connect to the node's
`api_port` right away — not on a delay or a periodic cycle. Against an
address nothing is listening on, that task fails fast (sub-millisecond on
loopback) and writes `status: 'error'` plus a `message`. If a `modifyNode`
call — including one that explicitly sets `status: 'disabled'` — lands
while that task is still in flight, the two writes race: depending on
ordering, the task's failure write can land _after_ the disable and silently
overwrite both `status` (back to `'error'`) and `message`, even though the
`modifyNode` call itself returned `status: 'disabled'`. Reproduced via the
SDK's own back-to-back calls (curl invocations, with their extra
process-spawn latency between requests, consistently missed the window and
never showed it).

**Workaround:** poll `getNode` until `status` is no longer `'connecting'`
before modifying a freshly created node — `waitForNodeSettled()` in
[`nodeFixture.ts`](../packages/sdk/test/integration/helpers/nodeFixture.ts),
used by
[`node.integration.test.ts`](../packages/sdk/test/integration/node.integration.test.ts)'s
disable test. Once the connection attempt has resolved, there's nothing
left to race.

**Open:** the SDK itself doesn't special-case this — a real caller that
disables a node right after creating it can observe the same lost update.
Whether `modifyNode` on an _existing, already-settled_ node ever re-triggers
this same async check (as opposed to only on create) wasn't characterized.

## `addNode` ignores `usage_coefficient` on create — always stores `1.0`

**Verified against:** `gozargah/marzban:latest`, `local/marzban/`.

`NodeCreate.usage_coefficient` type-checks and the request accepts any
value `> 0`, but the panel always stores `1.0` for a newly created node
regardless of what was sent — the field is silently dropped on the create
path only. `modifyNode({ usage_coefficient })` on an existing node works as
documented: the value is stored and echoed back.

**Workaround:** none needed once known — set `usage_coefficient` with a
follow-up `modifyNode` call if it needs to be anything other than the
default. See
[`node.integration.test.ts`](../packages/sdk/test/integration/node.integration.test.ts),
which asserts the create response always has `usage_coefficient: 1` and
verifies the field only through `modifyNode`.

**Open:** whether this is intentional or a panel bug wasn't investigated
further.

## WebSocket log handshake rejections collapse into a generic HTTP 403

**Verified against:** `gozargah/marzban:v0.8.4`, `local/marzban/`.

The panel authorizes a `/api/core/logs`/`/api/node/{id}/logs` connection
before calling `websocket.accept()` — an expired token, a non-sudo admin
token, and an `interval` outside the accepted range are all rejected at this
stage. uvicorn collapses whatever close code the application logic intended
(4401/4403/4400) into one generic HTTP 403 on the handshake response; the
client sees only "403", never which of those three conditions caused it.

The panel's own `interval` contract (`app/routers/core.py`/`node.py`) is
looser than its error message suggests: the value is parsed as a `float`
(fractional intervals like `0.5` are accepted), only `> 10` or a
non-numeric value is rejected, and `0` is accepted and treated as "no
batching — send every line immediately".

**Workaround:** none at the panel level for the non-sudo/expired-token
cases — a client can't distinguish "token expired" from "not sudo" from the
handshake response alone. `LogsStream` validates `interval` against the
panel's own `0`–`10` range client-side before opening a socket (throwing
`WsOptionsError`), so an out-of-range `interval` no longer round-trips into
this 403 collapse at all.
[`logs.integration.test.ts`](../packages/sdk/test/integration/logs.integration.test.ts)
asserts that client-side rejection directly. The real-socket fixture in
[`packages/sdk/src/testing/mock-panel.ts`](../packages/sdk/src/testing/mock-panel.ts)
models the panel-side collapse for the remaining cases: its `reject`
handshake policy always closes before `websocket.accept()`, regardless of
the reason a real caller configures it to simulate.

The handshake's HTTP status is not reliably visible to a client either. The
native `WebSocket` global reports an empty `error` message and close code
`1006` (verified on Node 24), which is exactly what it reports for a refused
connection — only the `ws`-package fallback surfaces the status, as
`Unexpected server response: 403`. A client on the native transport therefore
cannot tell "the panel refused me" from "the panel is restarting" at all.

`LogsStream` no longer classifies by error text. It re-authenticates once on
any failure to reach `open` — that is the only way to distinguish an expired
token from the other causes — and treats a repeat failure as terminal for the
initial connect. It gives up on an established stream early only when a
status was actually reported _and_ the refusal survived a freshly issued
token (the non-sudo case, where retrying can never succeed); everything
ambiguous keeps retrying within a time budget, so a restarting panel is not
mistaken for a rejection. See
[ADR-0016](./adr/0016-ws-stream-lifecycle-and-reconnect.md).

## WebSocket log endpoints accept the token as a header, not just a query param

**Verified against:** `gozargah/marzban:v0.8.4` source
(`app/routers/core.py`/`node.py`):

```py
token = websocket.query_params.get("token") or websocket.headers.get(
    "Authorization", ""
).removeprefix("Bearer ")
```

The query parameter wins if both are present; the header is the fallback.
`LogStream` (`core/ws/log-stream.ts`) sends `Authorization: Bearer <token>`
on the `ws`-package transport instead of the query string, so the token
never lands in a reverse proxy's access log on that path — verified
directly against the running panel: the access log shows
`"WebSocket /api/core/logs?interval=1" [accepted]`, no `token=`. The native
`WebSocket` constructor has no headers option at all, so on that transport
(every browser, and Node.js 21+ without a configured `httpsAgent`) the token
still goes in the query string — a platform limit, not a choice. See
[ADR-0017](./adr/0017-ws-public-stream-surface.md).

## Every new WebSocket log connection replays up to the last 100 log lines

**Verified against:** `gozargah/marzban:v0.8.4`, `local/marzban/`.

`get_logs()` (`app/xray/core.py`) seeds each new connection's buffer from a
process-wide `deque(maxlen=100)`, so a freshly opened stream immediately
receives up to 100 lines that predate it — on a quiet panel, that can be the
Xray startup banner from hours earlier.

The consequence is a trade-off rather than a bug: a gap shorter than 100
lines loses nothing (a reconnect recovers what was missed), but a longer one
is unrecoverable, since the API exposes no cursor to resume from. It also
means every reconnect re-delivers already-seen lines, and
[ADR-0016](./adr/0016-ws-stream-lifecycle-and-reconnect.md)'s reconnect
policy makes reconnects far more common than before.

**Workaround:** client-side deduplication of recently delivered lines —
`LogOptions.replay: 'dedup'` (the default since `sdk-v4.0.0`), which tracks
the last ~200 delivered lines and drops a leading run of already-seen ones
after a reconnect. Per-line, not per-message: a batching `interval > 0`
joins several lines into one message on the live stream, but the panel's
replay buffer has no such grouping, so the two never line up. See
[ADR-0017](./adr/0017-ws-public-stream-surface.md).

## User-object datetime fields come back without a UTC offset

**Verified against:** `gozargah/marzban:v0.8.4`, `local/marzban/`, the
published `ilmar7786/marzban-mcp` Docker image wired into Claude Desktop.

`created_at`, `sub_updated_at`, `online_at`, and `on_hold_timeout` on
`UserResponse`/`SubscriptionUserResponse` are plain naive-datetime strings —
`"2026-09-02T14:00:57.764445"` — never `Z`, never `+00:00`. Confirmed via a
direct `GET /api/user/{username}` call with the admin token right after
`addUser`.

This is fine for the SDK, which parses these fields with
`z.iso.datetime({ local: true })` specifically because of this
(`packages/sdk/kubb.config.ts`). It stopped being fine at the MCP boundary:
`packages/mcp` reused those same SDK schemas as tool `outputSchema`s, and
`local: true` still lowers to a JSON Schema `format: "date-time"` — an
RFC 3339 claim of an offset that isn't there. A strict MCP client validating
`structuredContent` against that schema rejected every real response
(github.com/Ilmar7786/marzban-sdk#112).

**Workaround:** none needed on the SDK side — `local: true` is correct there.
At the MCP boundary, use `mcpUserResponseSchema`/
`mcpSubscriptionUserResponseSchema` (`packages/mcp/src/shared/schemas.ts`),
which override these four fields to plain `z.string()`. See
[ADR-0018](./adr/0018-mcp-output-schemas-no-format-keyword.md).
