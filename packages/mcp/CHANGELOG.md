# Changelog

## [mcp-v0.2.2] - 2026-08-31

### <!-- 1 -->🐛 Bug Fixes

- Correct Docker image's MCP Registry ownership label casing by @Ilmar7786
- Correct MCP Registry namespace casing to io.github.Ilmar7786 by @Ilmar7786
- Tolerate the removeUser 500 that follows a successful delete by @Ilmar7786
- Confirm=auto now trusts one call, not the whole tool by @Ilmar7786

### <!-- 2 -->🚜 Refactor

- Read the HTTP status from HttpError instead of digging it out by @Ilmar7786

### <!-- 6 -->🧪 Testing

- Cover per-call confirm trust and its expiry by @Ilmar7786

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Bump marzban-mcp to 0.2.2 by @Ilmar7786
- Bump marzban-mcp to 0.2.1 by @Ilmar7786
- Publish server metadata to MCP Registry by @Ilmar7786
- Add types:check to sdk, cli and mcp by @Ilmar7786

### 🔗 From marzban-sdk

- Bundles **marzban-sdk 3.3.0** (was 3.1.0) — see the [SDK release notes](https://github.com/Ilmar7786/marzban-sdk/releases/tag/sdk-v3.3.0).
- `POST` and other unsafe methods are no longer retried — a failed write now surfaces as a tool error instead of being silently replayed ([#75](https://github.com/Ilmar7786/marzban-sdk/issues/75))
- HTTP retries now actually run on API requests ([#92](https://github.com/Ilmar7786/marzban-sdk/pull/92))

## [mcp-v0.2.0] - 2026-08-21

### <!-- 0 -->🚀 Features

- Trust a custom CA via MARZBAN_TLS_CA_FILE by @Ilmar7786

### <!-- 6 -->🧪 Testing

- Cover the full user lifecycle live against a real panel by @Ilmar7786
- Trust the local panel's CA instead of disabling TLS verification by @Ilmar7786

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Bump marzban-mcp to 0.2.0 by @Ilmar7786

## [mcp-v0.1.1] - 2026-08-21

### <!-- 0 -->🚀 Features

- Split sdk/mcp release workflows, add mcp Docker publish by @Ilmar7786
- Make marzban-mcp publishable by @Ilmar7786
- Add prompts, server instructions, and tools/list cache hints by @Ilmar7786
- Add nodes, system, and subscription modules by @Ilmar7786
- Add the config module (core config, restart, hosts) by @Ilmar7786
- Add confirm_token confirmation and the two destructive user tools by @Ilmar7786
- Add the users module (read/write/renew/usage) and wire the server by @Ilmar7786
- Add tool contract, registry, error mapping, and output rendering by @Ilmar7786
- Scaffold the MCP server — config, SDK client, stdio entry by @Ilmar7786

### <!-- 1 -->🐛 Bug Fixes

- Potential fix for pull request finding 'CodeQL / Incomplete string escaping or encoding' by @Ilmar7786
- Require username+password, drop the token-only credential path by @Ilmar7786

### <!-- 10 -->💼 Other

- Potential fix for pull request finding 'CodeQL / Disabling certificate validation' by @Ilmar7786

### <!-- 2 -->🚜 Refactor

- Reorganize internal server code, no behavior change by @Ilmar7786
- Convert repository to a pnpm + turborepo monorepo by @Ilmar7786

### <!-- 6 -->🧪 Testing

- Add integration test suite against a live Marzban panel by @Ilmar7786

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Bump marzban-mcp to 0.1.1 to verify npm + Docker Hub publish by @Ilmar7786
- Add one-command Inspector setup for local dev by @Ilmar7786
