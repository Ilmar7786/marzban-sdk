<div align="center">

<img src="https://raw.githubusercontent.com/Ilmar7786/marzban-sdk/main/apps/docs/src/app/icon.svg" alt="marzban-mcp" width="80">

# marzban-mcp

**MCP server that lets AI agents manage a [Marzban](https://github.com/Gozargah/Marzban) panel — built on [`marzban-sdk`](https://www.npmjs.com/package/marzban-sdk).**

[![Docker image](https://img.shields.io/docker/v/ilmar7786/marzban-mcp?color=8b5cf6&label=docker&sort=semver)](https://hub.docker.com/r/ilmar7786/marzban-mcp)
[![Docker pulls](https://img.shields.io/docker/pulls/ilmar7786/marzban-mcp?color=8b5cf6)](https://hub.docker.com/r/ilmar7786/marzban-mcp)
[![license](https://img.shields.io/npm/l/marzban-mcp?color=8b5cf6)](https://github.com/Ilmar7786/marzban-sdk/blob/main/LICENSE)

[**Documentation**](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/overview) · [**Source**](https://github.com/Ilmar7786/marzban-sdk/tree/main/packages/mcp)

</div>

---

Users, subscriptions, nodes, and the core config — through Claude, Cursor, or any [MCP](https://modelcontextprotocol.io)-compatible client.

## Usage

This image speaks MCP over stdio — there's nothing to expose on a port. Your
MCP client (Claude Desktop, Claude Code, Cursor, ...) launches the container
itself; you don't run it standalone. A typical client config:

```json
{
  "mcpServers": {
    "marzban": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "MARZBAN_BASE_URL",
        "-e", "MARZBAN_USERNAME",
        "-e", "MARZBAN_PASSWORD",
        "ilmar7786/marzban-mcp"
      ],
      "env": {
        "MARZBAN_BASE_URL": "https://panel.example.com",
        "MARZBAN_USERNAME": "admin",
        "MARZBAN_PASSWORD": "secret"
      }
    }
  }
}
```

## Environment variables

| Variable           | Required | Description                                                        |
| ------------------ | -------- | -------------------------------------------------------------------- |
| `MARZBAN_BASE_URL` | Yes      | Your panel's URL, e.g. `https://panel.example.com`                   |
| `MARZBAN_USERNAME` | Yes      | Admin username                                                       |
| `MARZBAN_PASSWORD` | Yes      | Admin password — also used to silently re-authenticate on expiry     |

Optional variables (profile, output format, tool allow/deny filters, log
level, confirmation policy) are documented in
[Configuration](https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/configuration).

## Features

- Env-only credentials — panel URL/user/password are never accepted as a tool argument
- Profile-gated tools — `readonly` / `standard` / `full`, unavailable tools never appear in `tools/list`
- Confirmation required on every destructive call (delete, reset traffic, rewrite config, restart core)
- Credentials masked by default (`proxies`, `subscription_url`, `links`)
- 21 tools, 3 prompts covering users, config, hosts, nodes, system stats and subscriptions

## Tags

- `latest` / `x.y.z` — multi-arch (amd64/arm64), built from [releases](https://github.com/Ilmar7786/marzban-sdk/releases)

## License

MIT © [ilmar7786](https://github.com/Ilmar7786)
