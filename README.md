# Marzban SDK

The Marzban SDK is a fully typed client library for interacting with the Marzban API. It works in both browser and Node.js environments.

## Features

- Full TypeScript typing and schema definitions for all parameters, responses, and methods.
- Automatic token refresh.
- Automatic retry mechanism for network requests.
- Comprehensive method support.
- WebSocket support for real-time log streaming core service and Nodes.

## Installation

```sh
npm install marzban-sdk
```

## Full Typing and Schema

The SDK provides full TypeScript typing and schema definitions for all parameters, responses, and methods. This ensures type safety and better development experience.

## Generated Sources

The SDK uses generated sources from the OpenAPI specification to ensure up-to-date and accurate API methods. The entry point for the SDK is the `MarzbanSDK` class.

## Usage

### Importing the SDK

```typescript
import { MarzbanSDK, Config } from "marzban-sdk";
```

### Configuration

The `MarzbanSDK` constructor requires a configuration object with the following properties:

- `baseUrl`: The base URL of the Marzban API.
- `username`: The username for authentication.
- `password`: The password for authentication.
- `retries`: Optional parameter. Number of retry requests.

### Example

```typescript
import { MarzbanSDK, Config } from "marzban-sdk";

const config: Config = {
  baseUrl: "https://api.example.com",
  username: "your-username",
  password: "your-password",
  retries: 3, // optional parameter
};

const sdk = new MarzbanSDK(config);

// Example usage of a method
sdk.user.getUserById("user-id").then((user) => {
  console.log(user);
});
```

## API Documentation

For detailed API documentation, please refer to the [API Documentation](./docs/API_DOCUMENTATION.md).

## Logs Service via MarzbanSDK

The `LogsApi` module in the `MarzbanSDK` allows you to connect to logs via WebSocket. This service supports automatic token refresh and retry mechanisms for failed connections.

### Connecting to Core Logs

To connect to core logs, use the `connectByCore` method. It accepts an options object with callbacks for handling messages and errors. The `onError` callback is optional.

```typescript
import { MarzbanSDK, Config } from "marzban-sdk";

const config: Config = {
  baseUrl: "https://api.example.com",
  username: "your-username",
  password: "your-password",
  retries: 3,
};

const sdk = new MarzbanSDK(config);

const closeConnection = await sdk.logs.connectByCore({
  interval: 5, // Interval for sending messages (in seconds)
  onMessage: (data) => {
    console.log("Received message:", data);
  },
  // Optional error handler
  onError: (error) => {
    console.error("Connection error:", error);
  },
});

// To close the connection, call the returned function
closeConnection();
```

### Connecting to Node Logs

To connect to logs for a specific node, use the `connectByNode` method. Provide the node ID and an options object. The `onError` callback is optional.

```typescript
const nodes = await sdk.node.getNodes();

const closeNodeConnection = await sdk.logs.connectByNode(nodes[0].id, {
  interval: 10,
  onMessage: (data) => {
    console.log("Node logs:", data);
  },
  // Optional error handler
  onError: (error) => {
    console.error("Node connection error:", error);
  },
});

// To close the connection, call the returned function
closeNodeConnection();
```

### Closing All Connections

You can close all active WebSocket connections using the `closeAllConnections` method.

```typescript
sdk.logs.closeAllConnections();
console.log("All WebSocket connections closed.");
```

## License

This project is licensed under the MIT License.
