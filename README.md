# Marzban SDK

The Marzban SDK is a fully typed client library for interacting with the Marzban API. It works in both browser and Node.js environments.


## Features

- Full TypeScript typing and schema definitions for all parameters, responses, and methods.
- Automatic token refresh.
- Automatic retry mechanism for network requests.
- Comprehensive method support.

## Installation

```sh
npm install marzban-sdk
```

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

## Full Typing and Schema

The SDK provides full TypeScript typing and schema definitions for all parameters, responses, and methods. This ensures type safety and better development experience.

## Generated Sources

The SDK uses generated sources from the OpenAPI specification to ensure up-to-date and accurate API methods. The entry point for the SDK is the `MarzbanSDK` class.

## License

This project is licensed under the MIT License.
