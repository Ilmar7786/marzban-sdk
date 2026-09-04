<div align="center">

<img src="https://raw.githubusercontent.com/Ilmar7786/marzban-sdk/main/apps/docs/src/app/icon.svg" alt="marzban-mcp" width="80">

# marzban-mcp

**An MCP server that lets AI agents manage a [Marzban](https://github.com/Gozargah/Marzban) panel — built on [`marzban-sdk`](https://www.npmjs.com/package/marzban-sdk).**

Users, subscriptions, nodes, and the core config — through Claude, Cursor, or any [MCP](https://modelcontextprotocol.io)-compatible client.

[![npm version](https://img.shields.io/npm/v/marzban-mcp?color=8b5cf6&label=npm)](https://www.npmjs.com/package/marzban-mcp)
[![npm downloads](https://img.shields.io/npm/dm/marzban-mcp?color=8b5cf6)](https://www.npmjs.com/package/marzban-mcp)
[![Docker image](https://img.shields.io/docker/v/ilmar7786/marzban-mcp?color=8b5cf6&label=docker&sort=semver)](https://hub.docker.com/r/ilmar7786/marzban-mcp)
[![license](https://img.shields.io/npm/l/marzban-mcp?color=8b5cf6)](./LICENSE)

[**Documentation**](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/overview) · [**Client Setup**](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/client-setup) · [**Tools**](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/tools)

</div>

---

Point an AI agent at your panel and it can actually run it — not just read
about it. No custom integration code, just an entry in your MCP config.

## Install

```sh
npm install -g marzban-mcp
```

You don't usually need to install it yourself — your MCP client runs it via `npx` (see below). Prefer a container? A multi-arch image is published at [`ilmar7786/marzban-mcp`](https://hub.docker.com/r/ilmar7786/marzban-mcp):

```sh
docker pull ilmar7786/marzban-mcp
```

## Quick start

Add it to your client's MCP config with your panel's URL and an admin login. Every client reads roughly the same shape:

```json
{
  "mcpServers": {
    "marzban": {
      "command": "npx",
      "args": ["-y", "marzban-mcp"],
      "env": {
        "MARZBAN_BASE_URL": "https://panel.example.com",
        "MARZBAN_USERNAME": "admin",
        "MARZBAN_PASSWORD": "secret"
      }
    }
  }
}
```

Claude Desktop, Claude Code, Cursor and other MCP clients all read the same
`mcpServers` block — just from a different config file. Restart the client
and the tools below become available.

## Features

- 🔒 **Env-only credentials** — the panel URL, username and password are never accepted as a tool argument, so a compromised or confused model can't redirect the server elsewhere.
- 🎯 **Profile-gated tools** — a tool outside the active profile never appears in `tools/list` at all, not just hidden behind a hint.
- ✅ **Confirmation on every destructive call** — the first call only describes the consequences and returns a one-time token; nothing runs until a human-approved second call repeats it, and confirming one call never authorizes a different target or a wider version of the same call.
- 🙈 **Credentials masked by default** — `proxies`, `subscription_url` and `links` stay hidden unless you explicitly opt in.
- 🧭 **21 tools, 3 prompts** — full user lifecycle, config, hosts, nodes, system stats and subscriptions, plus ready-made investigations that chain several tools together.
- 🛠️ **Built on `marzban-sdk`** — the same auth, retry and reconnect behavior as the SDK itself, just exposed as MCP tools.

## Configuration

| Variable           | Required | Description                                                      |
| ------------------ | -------- | ---------------------------------------------------------------- |
| `MARZBAN_BASE_URL` | Yes      | Your panel's URL, e.g. `https://panel.example.com`               |
| `MARZBAN_USERNAME` | Yes      | Admin username                                                   |
| `MARZBAN_PASSWORD` | Yes      | Admin password — also used to silently re-authenticate on expiry |

Everything else — profile, output format, verbosity, tool allow/deny filters,
log level, link masking — is optional and documented in
[Configuration](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/configuration).

## Tools

21 tools, namespaced `marzban_<area>_<action>`: **Users** (11) · **Config** (5)
· **System & nodes** (3) · **Subscription** (2). Three prompts —
`expiring_users_audit`, `node_diagnostics`, `traffic_report` — chain those
tools into ready-made investigations. Full list at
[Tools](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/tools) &
[Prompts](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/prompts).

## Safety model

A profile isn't a hint — a tool outside it never appears in `tools/list`, so a
model can't call what it can't see. `readonly` exposes only lists and
lookups; `standard` (default) adds full user CRUD, renewals and status
changes; `full` adds destructive tools — delete, reset traffic, rewrite
config, restart the core.

Destructive tools also gate on confirmation: the first call never runs
anything — it describes exactly what would happen and returns a one-time
token. Only a second call, with that token attached, executes. `MARZBAN_MCP_CONFIRM`
controls how often this is required: `auto` (default, once per tool _and_
exact arguments, for 5 minutes — a different target or a wider call always
needs its own confirmation), `always` (every call), or `off` (unattended
environments only — no safety net once set).

## Documentation

Full setup guides and the complete tool/prompt reference live at
**[ilmar7786.github.io/marzban-sdk](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/overview)**:

- [Client setup](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/client-setup) & [Configuration](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/configuration)
- [Tools](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/tools) & [Prompts](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/prompts)
- [Response format](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/response-format)
- [Security](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/security)

## Contributing

This package lives in the [`marzban-sdk`](https://github.com/Ilmar7786/marzban-sdk)
monorepo — see the root [CONTRIBUTING.md](https://github.com/Ilmar7786/marzban-sdk/blob/main/CONTRIBUTING.md)
for how to submit a patch. Running the server locally in watch mode, poking
it with the MCP Inspector, or wiring a client to your own build? See
[ARCHITECTURE.md § Local development & manual testing](https://github.com/Ilmar7786/marzban-sdk/blob/main/packages/mcp/ARCHITECTURE.md#local-development--manual-testing).
Found a bug or have an idea?
[Open an issue](https://github.com/Ilmar7786/marzban-sdk/issues).

## License

[MIT](./LICENSE) © [ilmar7786](https://github.com/Ilmar7786)

<div align="center">
<sub>If <code>marzban-mcp</code> saves you time, consider giving it a ⭐ on <a href="https://github.com/Ilmar7786/marzban-sdk">GitHub</a>.</sub>
</div>
