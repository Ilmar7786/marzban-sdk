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
- [📡 WebSocket Support](#-websocket-support)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [⭐ Support the Project](#-support-the-project)

## ✨ Features

- ✅ **First-class TypeScript Support** – Autocomplete and type safety for all inputs and responses.
- 🔐 **Manual or Automatic Authorization** – Choose between explicit login with full error handling, or backward-compatible automatic login.
- 🔄 **Auto Token Refresh** – Seamless handling of session expiration.
- 🔁 **Built-in Retry Logic** – Robust handling of network errors and downtime.
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
```

You can also force re-authentication at any time:

```typescript
await sdk.authorize(true) // Force a new login, even if already authenticated
```

### Asynchronous Initialization

For convenient asynchronous initialization with error handling, use the static method:

```typescript
try {
  const sdk = await MarzbanSDK.createAsync({
    baseUrl: 'https://api.example.com',
    username: 'your-username',
    password: 'your-password',
  })
  // Now you can perform requests
} catch (e) {
  // Handle authentication error
}
```

## 🚀 Quick Start

```typescript
import { MarzbanSDK, Config } from 'marzban-sdk'

// Automatic authentication (default)
const sdk = new MarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'your-username',
  password: 'your-password',
})

// Manual authentication
const sdkManual = new MarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'your-username',
  password: 'your-password',
  authenticateOnInit: false,
})
await sdkManual.authorize()

// Asynchronous factory with authentication and error handling
try {
  const sdkAsync = await MarzbanSDK.createAsync({
    baseUrl: 'https://api.example.com',
    username: 'your-username',
    password: 'your-password',
  })
  // Use sdkAsync for authenticated requests
} catch (e) {
  // Handle authentication error
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

## 🔍 How It Works

### **1️⃣ Full Typing and Schema**

MarzbanSDK provides full TypeScript typing and schema definitions for all API methods, parameters, and responses.

### **2️⃣ Generated Sources**

The SDK is **auto-generated from the OpenAPI specification**, ensuring it stays up-to-date with API changes.

- The entry point for the SDK is the **`MarzbanSDK`** class.
- All API methods are dynamically generated based on the OpenAPI schema.

## 📚 API Documentation

For detailed API reference, visit the [API Documentation](./docs/API_DOCUMENTATION.md).

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
