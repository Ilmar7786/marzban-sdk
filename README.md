<div align="center">
  <img src="./docs/logo.png" alt="MarzbanSDK" width="320px" height="320px" />
</div>

# 🚀 MarzbanSDK

<div align="center">

[![npm version](https://img.shields.io/npm/v/marzban-sdk)](https://www.npmjs.com/package/marzban-sdk/v/latest)
[![npm downloads](https://img.shields.io/npm/dm/marzban-sdk)](https://www.npmjs.com/package/marzban-sdk)
[![total downloads](https://img.shields.io/npm/dt/marzban-sdk)](https://www.npmjs.com/package/marzban-sdk)
[![license](https://img.shields.io/npm/l/marzban-sdk)](https://github.com/Ilmar7786/marzban-sdk/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Ilmar7786/marzban-sdk)](https://github.com/Ilmar7786/marzban-sdk)

</div>

---

> 🚧 **We're working on Marzban SDK 2.0.0 — the biggest update yet!**
>
> This release brings fundamental improvements:
>
> - 🛡️ Strict validation with Zod schemas
> - 🔌 Plugin system for HTTP & WebSocket requests
> - ⚠️ Unified error system with dedicated classes
> - 📝 Configurable logger
> - 💻 CLI tool (planned)
>
> 👉 Share your feedback! What features would you like to see? 👉 [Join the discussion on GitHub](https://github.com/Ilmar7786/marzban-sdk/discussions/30)

---

**MarzbanSDK** is a fully typed TypeScript client for interacting with the [Marzban](https://github.com/Gozargah/Marzban) API.  
It provides a clean, consistent, and developer-friendly interface — with built-in authentication, retries, and WebSocket support.

Unlike some SDK generators, **MarzbanSDK does not dynamically generate or rebuild code from OpenAPI**.  
Instead, all methods and types are **implemented directly as strongly-typed TypeScript definitions**, originally based on Marzban’s OpenAPI schema — but maintained and refined manually for better developer experience.

The SDK works seamlessly in **both Node.js and browser environments**.

👉 [View on GitHub](https://github.com/Ilmar7786/marzban-sdk)

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📑 Configuration Options](#-configuration-options)
- [🔐 Authorization Control](#-authorization-control)
- [🔍 How It Works](#-how-it-works)
- [📚 API Documentation](#-api-documentation)
- [📡 WebSocket Support](#-websocket-support)
- [🔌 Plugin System](#-plugin-system)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [⭐ Support the Project](#-support-the-project)

---

## ✨ Features

- ✅ **First-class TypeScript Support** — All methods, parameters, and responses are strongly typed.
- 🌐 **Works in Node.js and Browser** — Fully compatible with both environments.
- 🔐 **Manual or Automatic Authorization** — Choose explicit or automatic login with full error handling.
- 🔄 **Auto Token Refresh** — Automatic session renewal on expiration.
- 🔁 **Retry Logic** — Resilient against temporary network errors.
- 📡 **Real-time WebSocket Logging** — Stream logs from core or nodes.
- 📘 **OpenAPI-based Implementation** — Methods and types are derived from Marzban’s OpenAPI specification, but implemented as native TS code for stability and flexibility.

---

## 📦 Installation

Install MarzbanSDK via npm:

```sh
npm install marzban-sdk
```

Or using yarn:

```sh
yarn add marzban-sdk
```

---

## 📑 Configuration Options

The `Config` object is used to initialize the MarzbanSDK instance. Below are all available options:

| Name                 | Type    | Required | Default | Description                                                                                        |
| -------------------- | ------- | -------- | ------- | -------------------------------------------------------------------------------------------------- |
| `baseUrl`            | string  | Yes      | —       | The base URL of the Marzban API instance. Example: `https://api.example.com`                       |
| `username`           | string  | Yes      | —       | The username for authentication.                                                                   |
| `password`           | string  | Yes      | —       | The password for authentication.                                                                   |
| `token`              | string  | No       | —       | Optional JWT token for direct authorization. If provided, SDK uses this token for requests.        |
| `retries`            | number  | No       | 3       | Number of automatic retries for failed HTTP requests.                                              |
| `authenticateOnInit` | boolean | No       | true    | If true (default), SDK authenticates automatically on init. If false, call `authorize()` manually. |

---

## 🔐 Authorization Control

MarzbanSDK gives you full control over authentication:

- **Automatic authentication** (default): The SDK logs in as soon as you create an instance.
- **Manual authentication**: Set `authenticateOnInit: false` to delay login and handle errors yourself.

```typescript
import { MarzbanSDK, AuthenticationError } from 'marzban-sdk'

const sdk = new MarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  authenticateOnInit: false, // Manual mode
})

try {
  await sdk.authorize() // Explicit login
  // Now you can make authenticated requests
} catch (e) {
  if (e instanceof AuthenticationError) {
    // Handle authentication failure
  }
}

// Fetch user details
sdk.user.getUserById('user-id').then(user => {
  console.log(user)
})

// Get an authorization token
sdk.getAuthToken().then(token => {
  console.log(token)
})
```

You can also force re-authentication at any time:

```typescript
await sdk.authorize(true) // Force a new login, even if already authenticated
```

See [Config interface documentation](./src/MarzbanSDK.ts) for all available options.

---

## 🚀 Quick Start

```typescript
import { MarzbanSDK, Config } from 'marzban-sdk'

const sdk = new MarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'your-username',
  password: 'your-password',
})

// Fetch user details
sdk.user.getUserById('user-id').then(user => {
  console.log(user)
})

// Get an authorization token
sdk.getAuthToken().then(token => {
  console.log(token)
})
```

---

## 🔍 How It Works

MarzbanSDK is built around a clean TypeScript architecture:

### 1️⃣ **Strong Typing and Validation**

Every method, parameter, and response is defined using TypeScript types derived from Marzban’s OpenAPI schema.

### 2️⃣ **Static Implementation**

The SDK itself is **not generated at runtime** — all types and methods are implemented within the library for consistency and performance.

### 3️⃣ **Unified API Interface**

Access all Marzban endpoints through a single, well-structured class: `MarzbanSDK`.

### 4️⃣ **Cross-Platform Support**

The SDK uses platform-agnostic HTTP clients, making it work seamlessly in:

- Node.js environments
- Modern browsers
- React/Next.js applications
- Other JavaScript runtimes

---

## 📚 API Documentation

Full API reference and usage examples are available here:

[API Documentation](./docs/API_DOCUMENTATION.md).

---

## 📡 WebSocket Support

MarzbanSDK supports WebSocket for **real-time log streaming**.  
You can receive logs from both the **core server** and individual **nodes**.

For more details, check the [WebSocket Guide](./docs/WEBSOCKET.md).

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation:

1. 🚀 Fork the repository
2. 🔧 Create a feature branch
3. 📝 Make your changes
4. 🎉 Submit a pull request

Check our [Contribution Guidelines](./docs/CONTRIBUTING.md) for details.

---

## 📜 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## ⭐ Support the Project

If MarzbanSDK helps your project, please:

- ⭐ Star the repository on GitHub
- 🐛 Report issues you encounter
- 💡 Suggest improvements and new features
- 📢 Share with other developers

Your support helps us improve the library for everyone! ❤️

---

MarzbanSDK - TypeScript client for Marzban API • [GitHub Repository](https://github.com/Ilmar7786/marzban-sdk)
