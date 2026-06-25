<div align="center">

<img src="./docs/src/app/icon.svg" alt="MarzbanSDK" width="80">

# MarzbanSDK

**The complete TypeScript SDK for the [Marzban](https://github.com/Gozargah/Marzban) API.**

Typed endpoints, auto token refresh, retries, WebSocket log streaming, webhooks
and runtime validation — isomorphic for Node.js and the browser.

[![npm version](https://img.shields.io/npm/v/marzban-sdk?color=8b5cf6&label=npm)](https://www.npmjs.com/package/marzban-sdk)
[![npm downloads](https://img.shields.io/npm/dm/marzban-sdk?color=8b5cf6)](https://www.npmjs.com/package/marzban-sdk)
[![total downloads](https://img.shields.io/npm/dt/marzban-sdk?color=8b5cf6)](https://www.npmjs.com/package/marzban-sdk)
[![bundle size](https://img.shields.io/bundlephobia/minzip/marzban-sdk?color=8b5cf6&label=size)](https://bundlephobia.com/package/marzban-sdk)
[![types](https://img.shields.io/npm/types/marzban-sdk?color=8b5cf6)](https://www.npmjs.com/package/marzban-sdk)
[![license](https://img.shields.io/npm/l/marzban-sdk?color=8b5cf6)](./LICENSE)

[**Documentation**](https://ilmar7786.github.io/marzban-sdk) · [**Quick Start**](https://ilmar7786.github.io/marzban-sdk/docs/get-started/quick-start) · [**API Reference**](https://ilmar7786.github.io/marzban-sdk/docs)

</div>

---

`marzban-sdk` is far more than an API client. It bundles the entire
infrastructure layer a serious Marzban integration needs — so you ship features,
not plumbing. Every endpoint, parameter and response is generated from the
official OpenAPI spec and fully typed, with autocomplete across the whole API.

## Install

```sh
npm install marzban-sdk
```

<sub>Also works with `pnpm add`, `yarn add`, or `bun add`.</sub>

## Quick start

```ts
import { createMarzbanSDK, isAuthError } from 'marzban-sdk'

// One call authenticates and wires up every API module.
// Token refresh and retries are handled for you.
const sdk = await createMarzbanSDK({
  baseUrl: 'https://panel.example.com',
  username: 'admin',
  password: 'secret',
})

// Fully typed API surface: users · nodes · system · subscriptions · …
const { users } = await sdk.user.getUsers({ status: 'active', limit: 10 })
const stats = await sdk.system.getSystemStats()

// Stream real-time logs from the core over WebSocket
const close = await sdk.logs.connectByCore({
  onMessage: data => console.log(data),
})

// Typed, narrowable error handling
try {
  await sdk.user.getUser('does-not-exist')
} catch (err) {
  if (isAuthError(err)) await sdk.authorize()
}
```

## Features

- 🔠 **End-to-end type safety** — every endpoint, parameter and response is fully typed, [generated straight from the official OpenAPI spec](https://ilmar7786.github.io/marzban-sdk/docs/get-started/typescript). Matching Zod schemas ship alongside every model.
- 🌐 **Truly cross-runtime** — one package, one identical API across [Node.js, Bun, Deno and the browser](https://ilmar7786.github.io/marzban-sdk/docs/integrations/node-bun-deno). Native `WebSocket` and the Web Crypto API where available, with a transparent `ws` fallback for older Node.js.
- 📦 **Modern build** — dual ESM + CJS bundle, side-effect free and [fully tree-shakeable](https://ilmar7786.github.io/marzban-sdk/docs/get-started/typescript), so you ship only what you use.
- 🔑 **Flexible authentication** — [log in on init, hand the SDK an existing JWT, or take full manual control](https://ilmar7786.github.io/marzban-sdk/docs/authentication/auto-authentication); expired sessions [refresh transparently on `401`](https://ilmar7786.github.io/marzban-sdk/docs/authentication/manual-auth), so your code never touches a token.
- 🔁 **Built-in resilience** — [configurable exponential back-off](https://ilmar7786.github.io/marzban-sdk/docs/advanced/http-retry) for transient network failures, plus automatic WebSocket reconnects.
- 🎯 **Classified errors** — `AuthError`, `HttpError`, `ConfigurationError` and webhook errors all extend `SdkError` with a machine-readable code and [type-guard helpers](https://ilmar7786.github.io/marzban-sdk/docs/advanced/error-handling) for precise handling.
- 🛡️ **Runtime validation** — [config and payloads validated with Zod](https://ilmar7786.github.io/marzban-sdk/docs/advanced/validation); misconfigured clients fail fast with readable details.
- 📡 **Real-time logs** — [stream live core and node logs over WebSocket](https://ilmar7786.github.io/marzban-sdk/docs/realtime/websocket-logs), with auto token refresh and reconnection.
- 📨 **Webhooks included** — [HMAC-SHA256 signature verification](https://ilmar7786.github.io/marzban-sdk/docs/webhooks/signature-verification), typed event subscriptions, wildcard handlers and batch processing.
- 🛠️ **Batteries-included utilities** — first-class helpers for [data-size conversion, datetime math and subscription template variables](https://ilmar7786.github.io/marzban-sdk/docs/utilities/data-sizes).

## API modules

| Module         | Access             | What it does                                              |
| -------------- | ------------------ | --------------------------------------------------------- |
| Users          | `sdk.user`         | Create, update, reset and inspect users and their traffic |
| Nodes          | `sdk.node`         | Add, configure and monitor connected nodes                |
| System         | `sdk.system`       | Live stats, inbounds and proxy host config                |
| Core           | `sdk.core`         | Read config, restart and control the Xray core            |
| Subscriptions  | `sdk.subscription` | Resolve subscription links and per-client configs         |
| User templates | `sdk.userTemplate` | Reusable templates for provisioning users                 |
| Admins         | `sdk.admin`        | Manage admin accounts and permissions                     |
| Logs           | `sdk.logs`         | WebSocket log streams from the core and nodes             |
| Webhooks       | `sdk.webhook`      | Verify and handle inbound Marzban events                  |

## Documentation

Full guides, configuration reference and the complete typed API live at
**[ilmar7786.github.io/marzban-sdk](https://ilmar7786.github.io/marzban-sdk)**:

- [Installation](https://ilmar7786.github.io/marzban-sdk/docs/get-started/installation) & [Quick Start](https://ilmar7786.github.io/marzban-sdk/docs/get-started/quick-start)
- [Configuration options](https://ilmar7786.github.io/marzban-sdk/docs/configuration/config-options)
- [Error handling](https://ilmar7786.github.io/marzban-sdk/docs/advanced/error-handling) & [validation](https://ilmar7786.github.io/marzban-sdk/docs/advanced/validation)
- [Webhooks](https://ilmar7786.github.io/marzban-sdk/docs/webhooks/event-types) & [WebSocket logs](https://ilmar7786.github.io/marzban-sdk/docs/realtime/websocket-logs)
- [Utilities](https://ilmar7786.github.io/marzban-sdk/docs/utilities/data-sizes)

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Found a bug
or have an idea? [Open an issue](https://github.com/Ilmar7786/marzban-sdk/issues).

## License

[MIT](./LICENSE) © [ilmar7786](https://github.com/Ilmar7786)

<div align="center">
<sub>If <code>marzban-sdk</code> saves you time, consider giving it a ⭐ on <a href="https://github.com/Ilmar7786/marzban-sdk">GitHub</a>.</sub>
</div>
