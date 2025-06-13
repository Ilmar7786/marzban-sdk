<div align="center">
  <img src="./docs/logo.png" alt="MarzbanSDK" width="320px" height="320px" />
</div>

# 🚀 MarzbanSDK

<div align="center">

![npm version](https://img.shields.io/npm/v/marzban-sdk)
![npm downloads](https://img.shields.io/npm/dm/marzban-sdk)
![npm downloads](https://img.shields.io/npm/dt/marzban-sdk)
![npm license](https://img.shields.io/npm/l/marzban-sdk)
![github starts](https://img.shields.io/github/stars/Ilmar7786/marzban-sdk)

</div>
MarzbanSDK is a fully typed client library for interacting with the Marzban API. It supports both browser and Node.js environments, providing seamless integration and enhanced developer experience.

## 📖 Table of Contents

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🔍 How It Works](#-how-it-works)
- [📚 API Documentation](#-api-documentation)
- [📡 WebSocket Support](#-websocket-support)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [⭐ Support the Project](#-support-the-project)

## ✨ Features

- ✅ **Full TypeScript Support** – Schema definitions for all parameters, responses, and methods.
- 🔄 **Automatic Token Refresh** – Keeps your session alive without manual intervention.
- 🔁 **Retry Mechanism** – Ensures resilience against network failures.
- 🛠️ **Comprehensive API Support** – Access all Marzban API features.
- 📡 **[WebSocket Support](./docs/WEBSOCKET.md)** – Real-time log streaming from core services and nodes.

## 📦 Installation

Install MarzbanSDK via npm:

```sh
npm install marzban-sdk
```

Or using yarn:

```sh
yarn add marzban-sdk
```

## 🚀 Quick Start

```typescript
import { MarzbanSDK, Config } from 'marzban-sdk'

const config: Config = {
  baseUrl: 'https://api.example.com',
  username: 'your-username',
  password: 'your-password',
  retries: 3, // Option. default 3
  token: 'token', // Option
}

const sdk = new MarzbanSDK(config)

// Fetch user details
sdk.user.getUserById('user-id').then(user => {
  console.log(user)
})

// get an authorization token
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

For details, check our [Contribution Guidelines](./CONTRIBUTING.md).

## 📜 License

This project is licensed under the MIT License.

## ⭐ Support the Project

If you find marzban-sdk useful, please give it a star on [GitHub](https://github.com/Ilmar7786/marzban-sdk)! It helps us stay motivated and grow the project.
