<div align="center">

# marzban-mcp

**An MCP server that lets AI agents manage a [Marzban](https://github.com/Gozargah/Marzban) panel — built on [`marzban-sdk`](https://www.npmjs.com/package/marzban-sdk).**

Users, subscriptions, nodes, and the core config — through Claude, Cursor, or any [MCP](https://modelcontextprotocol.io)-compatible client.

</div>

---

## Install

```sh
npm install -g marzban-mcp
```

You don't usually need to install it yourself — your MCP client runs it via `npx` (see below).

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

- **Claude Desktop / Claude Code**: this same block, under `mcpServers`, in `claude_desktop_config.json` or your project's `.mcp.json`.
- **Cursor / other MCP clients**: check your client's docs for where it expects an `mcpServers` block — the entry itself is the same.

Restart the client and the tools below become available.

## Configuration

Configuration is env-only — the server never accepts credentials, a panel URL, or a profile switch as a tool argument, so a compromised or confused model can't redirect it elsewhere.

| Variable                  | Required | Default    | Description                                                                                                                                                                                              |
| ------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MARZBAN_BASE_URL`        | Yes      | —          | Your panel's URL, e.g. `https://panel.example.com`                                                                                                                                                       |
| `MARZBAN_USERNAME`        | Yes      | —          | Admin username                                                                                                                                                                                           |
| `MARZBAN_PASSWORD`        | Yes      | —          | Admin password. Marzban's sessions are short-lived and there's no separate long-lived API key, so the server needs this to silently re-authenticate when a token expires — not just for the first login. |
| `MARZBAN_TOKEN`           | No       | —          | An already-valid token, to skip the first login call. Never a substitute for the password above.                                                                                                         |
| `MARZBAN_MCP_PROFILE`     | No       | `standard` | `readonly` \| `standard` \| `full` — see [Profiles](#profiles)                                                                                                                                           |
| `MARZBAN_MCP_FORMAT`      | No       | `text`     | `text` \| `table` \| `json` — output format for tool results                                                                                                                                             |
| `MARZBAN_MCP_VERBOSITY`   | No       | `compact`  | `compact` \| `full` — how many fields each tool's response includes                                                                                                                                      |
| `MARZBAN_MCP_CONFIRM`     | No       | `auto`     | `off` \| `auto` \| `always` — see [Confirming destructive actions](#confirming-destructive-actions)                                                                                                      |
| `MARZBAN_MCP_MAX_CHARS`   | No       | `8000`     | Character budget per response before it's truncated (with an honest marker, never silent)                                                                                                                |
| `MARZBAN_MCP_TOOLS_ALLOW` | No       | —          | Comma-separated glob patterns — only matching tools are registered                                                                                                                                       |
| `MARZBAN_MCP_TOOLS_DENY`  | No       | —          | Comma-separated glob patterns — matching tools are never registered (wins over `_ALLOW`)                                                                                                                 |
| `MARZBAN_MCP_LOG_LEVEL`   | No       | `warn`     | `debug` \| `info` \| `warn` \| `error` — server logs go to stderr only, stdout is reserved for the protocol                                                                                              |
| `MARZBAN_MCP_SHOW_LINKS`  | No       | `false`    | Reveal `proxies`, `subscription_url`, and `links` in full — these are access credentials and stay masked by default                                                                                      |

## Profiles

A profile isn't a hint — a tool outside it never appears in `tools/list`, so a model can't call what it can't see.

| Profile              | What it exposes                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `readonly`           | Only read tools (lists, lookups, stats)                                                                                                                                                    |
| `standard` (default) | Read + write — full user CRUD, renewals, status changes, subscription lookups                                                                                                              |
| `full`               | Everything in `standard`, plus destructive tools — deleting a user, resetting traffic, rewriting the core config, restarting the core, replacing proxy hosts, revoking a subscription link |

## Tools

21 tools, namespaced `marzban_<area>_<action>`. † marks tools only available on the `full` profile.

**Users**
`marzban_users_list` · `marzban_users_get` · `marzban_users_create` · `marzban_users_update` · `marzban_users_activate` · `marzban_users_deactivate` · `marzban_users_hold` · `marzban_users_extend` · `marzban_users_usage` · `marzban_users_delete`† · `marzban_users_reset_traffic`†

**Config**
`marzban_config_get` · `marzban_config_update`† · `marzban_core_restart`† · `marzban_hosts_get` · `marzban_hosts_update`†

**System & nodes**
`marzban_system_stats` · `marzban_system_inbounds` · `marzban_nodes_list`

**Subscription**
`marzban_subscription_info` · `marzban_users_revoke_subscription`†

Three prompts are also included — `expiring_users_audit`, `node_diagnostics`, and `traffic_report` — each a ready-made investigation that chains several tools together.

## Confirming destructive actions

A destructive tool's first call never runs anything — it describes exactly what would happen (with real context: the target user's current status, a config diff, etc.) and returns a one-time token. Only a second call, with that token attached, actually executes. This is a genuine safety gate, not a formality: repeating a call with that token is only meant to happen after the human has actually said yes, not the model deciding on its own that it has "permission" because a token exists.

`MARZBAN_MCP_CONFIRM` controls how often this happens:

- **`auto`** (default) — confirm once per tool per session, then trusted for the rest of the connection.
- **`always`** — confirm every single call, no matter how many came before.
- **`off`** — skip confirmation entirely. Only for fully automated, unattended environments — there's no safety net once this is set.

## License

[MIT](../../LICENSE) © [ilmar7786](https://github.com/Ilmar7786)
