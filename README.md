<div align="center">

<img src="https://raw.githubusercontent.com/Ilmar7786/marzban-sdk/main/apps/docs/src/app/icon.svg" alt="MarzbanSDK" width="80">

# MarzbanSDK

**A TypeScript toolkit for the [Marzban](https://github.com/Gozargah/Marzban) API.**

[![CI](https://github.com/Ilmar7786/marzban-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Ilmar7786/marzban-sdk/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/Ilmar7786/marzban-sdk?color=8b5cf6)](./LICENSE)

[**Documentation**](https://ilmar7786.github.io/marzban-sdk) · [**SDK**](./packages/sdk) · [**MCP Server**](./packages/mcp)

</div>

---

One typed API client for Marzban, and everything built on top of it. Fix a
bug or add an endpoint in the SDK, and the MCP server, the CLI, and every app
built on it get it for free.

## How it fits together

```mermaid
flowchart LR
    Panel(["Marzban Panel"])
    SDK["marzban-sdk"]
    MCP["marzban-mcp<br/>MCP server"]
    CLI["marzban-cli<br/>CLI · WIP"]
    App["Your app<br/>Node · Bun · Deno · Browser"]
    Agents(["Claude · Cursor · any MCP client"])

    Panel <--> SDK
    SDK --> MCP --> Agents
    SDK --> CLI
    SDK --> App
```

The SDK talks to your Marzban panel. The MCP server and CLI are just clients
of that same SDK — same auth, same retries, same typed errors — so they never
drift from each other or from your own code.

## Packages

| Package                          | npm                                                        | Docker                                                                    | What it is                                                            |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`packages/sdk`](./packages/sdk) | [`marzban-sdk`](https://www.npmjs.com/package/marzban-sdk) | —                                                                         | The typed API client — auth, retries, WebSocket log streams, webhooks |
| [`packages/mcp`](./packages/mcp) | [`marzban-mcp`](https://www.npmjs.com/package/marzban-mcp) | [`ilmar7786/marzban-mcp`](https://hub.docker.com/r/ilmar7786/marzban-mcp) | An MCP server exposing Marzban operations as tools for AI agents      |
| [`packages/cli`](./packages/cli) | —                                                          | —                                                                         | A CLI on top of the SDK — WIP, unpublished                            |
| [`apps/docs`](./apps/docs)       | —                                                          | —                                                                         | The documentation site                                                |

Each publishable package has its own version, `README.md`, changelog and
release tags (`sdk-v*`, `mcp-v*`, `cli-v*`).

## Documentation

Full guides, configuration reference and the complete typed API live at
**[ilmar7786.github.io/marzban-sdk](https://ilmar7786.github.io/marzban-sdk)**.

For how the repository itself is built — architecture, conventions, testing,
CI and releases — see **[`docs/`](./docs/README.md)**.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to
submit a patch. Found a bug or have an idea?
[Open an issue](https://github.com/Ilmar7786/marzban-sdk/issues).

## License

[MIT](./LICENSE) © [ilmar7786](https://github.com/Ilmar7786)

<div align="center">
<sub>If this project saves you time, consider giving it a ⭐ on <a href="https://github.com/Ilmar7786/marzban-sdk">GitHub</a>.</sub>
</div>
