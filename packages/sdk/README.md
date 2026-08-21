<div align="center">

<img src="https://raw.githubusercontent.com/Ilmar7786/marzban-sdk/main/apps/docs/src/app/icon.svg" alt="MarzbanSDK" width="80">

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

`marzban-sdk` bundles the infrastructure layer a serious Marzban integration
needs — auth, retries, real-time logs, webhooks — so you ship features, not
plumbing. Every endpoint, parameter and response is generated from the
official OpenAPI spec and fully typed, with autocomplete across the whole API.

## Install

```sh
npm install marzban-sdk
```

<sub>Also works with `pnpm add`, `yarn add`, or `bun add`.</sub>

## Quick start

```ts
import { createMarzbanSDK } from 'marzban-sdk'

// One call authenticates and wires up every API module.
// Token refresh and retries are handled for you.
const sdk = await createMarzbanSDK({
  baseUrl: 'https://panel.example.com',
  username: 'admin',
  password: 'secret',
})

const { users } = await sdk.user.getUsers({ status: 'active', limit: 10 })

// Stream real-time logs from the core over WebSocket
const close = await sdk.logs.connectByCore({
  onMessage: data => console.log(data),
})
```

## Features

- 🔠 **End-to-end type safety** — every endpoint, parameter and response is fully typed, generated straight from the official OpenAPI spec, with matching Zod schemas.
- 🌐 **Truly cross-runtime** — one package, one identical API across Node.js, Bun, Deno and the browser.
- 🔑 **Flexible authentication** — log in on init or hand it an existing JWT; expired sessions refresh transparently, so your code never touches a token.
- 🔁 **Built-in resilience** — configurable exponential back-off for transient failures, plus automatic WebSocket reconnects.
- 🎯 **Classified errors** — `AuthError`, `HttpError`, `ConfigurationError` and webhook errors all extend `SdkError` with a machine-readable code and type-guard helpers.
- 📡 **Real-time logs & webhooks** — WebSocket log streams from the core and nodes, plus HMAC-verified inbound webhooks with typed event subscriptions.

## Documentation

Full guides, configuration reference and the complete typed API live at
**[ilmar7786.github.io/marzban-sdk](https://ilmar7786.github.io/marzban-sdk)**:

- [Installation](https://ilmar7786.github.io/marzban-sdk/docs/get-started/installation) & [Quick Start](https://ilmar7786.github.io/marzban-sdk/docs/get-started/quick-start)
- [API modules](https://ilmar7786.github.io/marzban-sdk/docs/modules/users) & [Configuration options](https://ilmar7786.github.io/marzban-sdk/docs/configuration/config-options)
- [Error handling](https://ilmar7786.github.io/marzban-sdk/docs/advanced/error-handling) & [validation](https://ilmar7786.github.io/marzban-sdk/docs/advanced/validation)
- [Webhooks](https://ilmar7786.github.io/marzban-sdk/docs/webhooks/event-types) & [WebSocket logs](https://ilmar7786.github.io/marzban-sdk/docs/realtime/websocket-logs)
- [Utilities](https://ilmar7786.github.io/marzban-sdk/docs/utilities/data-sizes)

## Contributing

This package lives in the [`marzban-sdk`](https://github.com/Ilmar7786/marzban-sdk)
monorepo — see the root [CONTRIBUTING.md](https://github.com/Ilmar7786/marzban-sdk/blob/main/CONTRIBUTING.md)
for how to submit a patch. Found a bug or have an idea?
[Open an issue](https://github.com/Ilmar7786/marzban-sdk/issues).

## License

[MIT](./LICENSE) © [ilmar7786](https://github.com/Ilmar7786)

<div align="center">
<sub>If <code>marzban-sdk</code> saves you time, consider giving it a ⭐ on <a href="https://github.com/Ilmar7786/marzban-sdk">GitHub</a>.</sub>
</div>
