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

**MarzbanSDK** is a fully typed, auto-generated client library for interacting with the [Marzban](https://github.com/Gozargah/Marzban) API.

It works seamlessly in both **Node.js** and **browser environments**, giving developers a clean, strongly-typed interface to Marzban’s full feature set — including real-time WebSocket support, token refresh handling, and robust retry mechanisms.

👉 [View on GitHub](https://github.com/Ilmar7786/marzban-sdk)

## 📖 Table of Contents

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📑 Configuration Options](#-configuration-options)
- [🔐 Authorization Control](#-authorization-control)
- [🔍 How It Works](#-how-it-works)
- [📚 API Documentation](#-api-documentation)
- [🎯 Error Handling](#-error-handling)
- [🔒 Data Validation](#-data-validation)
- [📨 Webhook Support](#-webhook-support)
- [🛠️ Utilities](#-utilities)
- [📡 WebSocket Support](#-websocket-support)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [⭐ Support the Project](#-support-the-project)

## ✨ Features

- ✅ **First-class TypeScript Support** – Autocomplete and type safety for all inputs and responses.
- 🔐 **Manual or Automatic Authorization** – Choose between explicit login with full error handling, or backward-compatible automatic login.
- 🔄 **Auto Token Refresh** – Seamless handling of session expiration.
- 🔁 **Built-in Retry Logic** – Robust handling of network errors and downtime.
- 🎯 **[Classified Error System](./docs/ERRORS.md)** – Type-safe error handling with detailed error codes and guards.
- 🔒 **[Zod Validation](./docs/VALIDATION.md)** – Runtime type validation for configuration and API payloads.
- 📨 **[Webhook Support](./docs/WEBHOOK.md)** – Real-time event handling with signature verification and payload validation.
- 🛠️ **[Utility Functions](./docs/UTILITIES.md)** – Helpers for bytes conversion, datetime calculations, and template variables.
- 📡 **[Real-time WebSocket Logging](./docs/WEBSOCKET.md)** – Stream logs from the core and nodes with ease.
- 📘 **Generated from OpenAPI** – Always up-to-date with the official Marzban API.

## 📦 Installation

Install MarzbanSDK via npm:

```sh
npm install marzban-sdk
```

Or using yarn:

```sh
yarn add marzban-sdk
```

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

## 🔐 Authorization Control

MarzbanSDK gives you full control over authentication:

- **Automatic authentication** (default): The SDK logs in as soon as you create an instance.
- **Manual authentication**: Set `authenticateOnInit: false` to delay login and handle errors yourself.

```typescript
import { createMarzbanSDK, isAuthError } from 'marzban-sdk'

const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  authenticateOnInit: false, // Manual mode
})

try {
  await sdk.authorize() // Explicit login
  // Now you can make authenticated requests
} catch (e) {
  if (isAuthError(e)) {
    // Handle authentication failure
    console.error('Invalid credentials')
  }
}
```

You can also force re-authentication at any time:

```typescript
await sdk.authorize(true) // Force a new login, even if already authenticated
```

See [Error Handling Guide](./docs/ERRORS.md) for comprehensive error handling patterns.

## 🚀 Quick Start

```typescript
import { createMarzbanSDK } from 'marzban-sdk'

// Create SDK instance with automatic authentication
const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'your-username',
  password: 'your-password',
})

// Or with manual authentication
const sdkManual = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'your-username',
  password: 'your-password',
  authenticateOnInit: false,
})
await sdkManual.authorize()

// Fetch user details
const user = await sdk.user.getUser('username')
console.log(user)

// Get an authorization token
const token = sdk.getAuthToken()
console.log(token)
```

## 🔍 How It Works

### **1️⃣ Full Typing and Schema**

MarzbanSDK provides full TypeScript typing and schema definitions for all API methods, parameters, and responses.

### **2️⃣ Generated Sources**

The SDK is **auto-generated from the OpenAPI specification**, ensuring it stays up-to-date with API changes.

- The entry point for the SDK is the **`MarzbanSDK`** class.
- All API methods are dynamically generated based on the OpenAPI schema.

## 📚 API Documentation

For detailed API reference, visit the [API Documentation](./docs/API_DOCUMENTATION.md).

## 🎯 Error Handling

MarzbanSDK provides a comprehensive error handling system with classified errors, type-safe guards, and detailed error information.

Learn how to handle:

- **Authentication errors** – Login and token failures
- **Configuration errors** – Invalid SDK setup
- **HTTP errors** – Network failures
- **Webhook errors** – Invalid signatures and payloads

→ See [Error Handling Guide](./docs/ERRORS.md)

## 🔒 Data Validation

All SDK configuration and API payloads are validated using **Zod** at runtime, ensuring type safety both at compile-time and runtime.

→ See [Validation Guide](./docs/VALIDATION.md)

## 📨 Webhook Support

Handle real-time events from Marzban with full webhook support:

- **Signature verification** – HMAC-SHA256 validation
- **Payload validation** – Zod-powered type-safe schemas
- **Event subscriptions** – Typed listeners with wildcards
- **Batch processing** – Handle multiple webhooks at once

→ See [Webhook Guide](./docs/WEBHOOK.md)

## 🛠️ Utilities

Helper utilities for common operations:

- **Bytes conversion** – Parse and format data sizes (GB, MB, etc.)
- **Datetime** – Date calculations and remaining time
- **Template variables** – Work with Marzban host-settings variables

→ See [Utilities Guide](./docs/UTILITIES.md)

## 📡 WebSocket Support

MarzbanSDK supports WebSocket for **real-time log streaming**.  
You can receive logs from both the **core server** and individual **nodes**.

For more details, check the [WebSocket Guide](./docs/WEBSOCKET.md).

## 🤝 Contributing

We welcome contributions! If you'd like to improve MarzbanSDK, please:

1. Fork the repository 🚀
2. Create a new branch 🔧
3. Submit a pull request 🎉

For details, check our [Contribution Guidelines](./docs/CONTRIBUTING.md).

## 📜 License

This project is licensed under the MIT License.

## ⭐ Support the Project

If you find marzban-sdk useful, please give it a star on [GitHub](https://github.com/Ilmar7786/marzban-sdk)! It helps us stay motivated and grow the project.
