# 📡 WebSocket Logs Documentation

## Overview

MarzbanSDK provides built-in support for real-time log streaming via WebSockets. This allows clients to receive live logs from core services and specific nodes.

## 📌 Features

- **Real-time logging** – Receive logs instantly from core services and nodes.
- **Automatic Reconnection** – Handles authentication renewal and retries failed connections.
- **Configurable Interval** – Adjust the frequency of log retrieval.
- **Error Handling** – Detects and manages WebSocket connection errors.

## 🔧 Usage

### 1️⃣ Connecting to Core Logs

The `connectByCore` method establishes a WebSocket connection to stream core service logs.

```typescript
const closeConnection = await sdk.logs.connectByCore({
  interval: 5, // Log update interval in seconds
  onMessage: data => console.log('Log:', data),
  onError: error => console.error('Error:', error),
})

// To close the connection
closeConnection()
```

### 2️⃣ Connecting to Node Logs

To stream logs from a specific node, use `connectByNode` with the node's ID.

```typescript
const nodes = await sdk.node.getNodes()
const closeNodeConnection = await sdk.logs.connectByNode(nodes[0].id, {
  interval: 10,
  onMessage: data => console.log('Node log:', data),
  onError: error => console.error('Node error:', error),
})

// To close the connection
closeNodeConnection()
```

## ❌ Closing All WebSocket Connections

To terminate all active WebSocket connections, use the `closeAllConnections` method.

```typescript
sdk.logs.closeAllConnections()
```

## ⚠️ Error Handling

The WebSocket client automatically retries authentication if a `403` error occurs. If the maximum retries are reached, the connection fails.

```typescript
onError: error => {
  console.error('WebSocket Error:', error)
}
```

## 📖 Additional Notes

- **Token Management**: The SDK automatically refreshes the authentication token when needed.
- **WebSocket Client**: Built on a `WebSocketClient` abstraction for efficient handling.

For more details, refer to the main [API Documentation](./API_DOCUMENTATION.md).
