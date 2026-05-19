# Error Handling 🚨

MarzbanSDK provides a comprehensive error handling system with classified errors, type-safe error checking, and detailed error information.

## Table of Contents

- [Overview](#overview)
- [Error Codes](#error-codes)
- [Error Classes](#error-classes)
  - [Base SdkError](#base-sdkerror)
  - [Categorized Errors](#categorized-errors)
- [Error Guards](#error-guards)
- [Error Handling Patterns](#error-handling-patterns)
- [Examples](#examples)

## Overview

MarzbanSDK errors are categorized by type, allowing you to handle different failure scenarios precisely:

- **Configuration Errors** – Invalid SDK configuration
- **Authentication Errors** – Login failures, token issues
- **HTTP Errors** – Network failures, API errors
- **Webhook Errors** – Invalid webhook signatures or payloads

All errors extend `SdkError`, which provides:
- `code` – Machine-readable error code
- `message` – Human-readable message
- `details` – Additional context (varies by error type)
- `name` – Error class name for instanceof checks

## Error Codes

All possible error codes are defined in `ERROR_CODES`:

```typescript
export const ERROR_CODES = {
  CONFIG_INVALID: 'Invalid SDK configuration',
  
  NETWORK_HTTP_ERROR: 'HTTP request failed',
  
  AUTH_TOKEN_FAILED: 'Failed to retrieve access token',
  AUTH_FAILED: 'Authentication failed',
  
  LOGGER_INVALID: 'Invalid logger option: must be false, LoggerOptions, or Logger instance',
  
  WEBHOOK_SIGNATURE_ERROR: 'Invalid webhook signature',
  WEBHOOK_VALIDATION_ERROR: 'Invalid webhook payload',
} as const
```

You can reference error codes using the `ErrorCode` type:

```typescript
import type { ErrorCode } from 'marzban-sdk'

function handleError(code: ErrorCode) {
  // code is fully typed with autocomplete
}
```

## Error Classes

### Base SdkError

All SDK errors inherit from `SdkError`:

```typescript
export class SdkError<T = unknown> extends Error {
  public readonly code: ErrorCode
  public readonly details?: T
}
```

**Creating errors programmatically:**

```typescript
import { SdkError } from 'marzban-sdk'

const error = SdkError.fromCode('CONFIG_INVALID', { reason: 'baseUrl is required' })
console.log(error.code)     // 'CONFIG_INVALID'
console.log(error.message)  // 'Invalid SDK configuration'
console.log(error.details)  // { reason: 'baseUrl is required' }
```

**Serializing errors:**

```typescript
const error = new AuthError({ statusCode: 401 })
const json = error.toJSON()
// { name: 'AuthError', code: 'AUTH_FAILED', message: '...', details: { statusCode: 401 } }
```

### Categorized Errors

#### AuthError / AuthTokenError

Thrown when authentication fails:

```typescript
import { AuthError, AuthTokenError } from 'marzban-sdk'

try {
  await sdk.authorize()
} catch (e) {
  if (e instanceof AuthError) {
    console.log('Login failed')
  } else if (e instanceof AuthTokenError) {
    console.log('Token retrieval failed')
  }
}
```

**Details:** May include HTTP status code, response body, or original error.

#### ConfigurationError

Thrown when SDK configuration is invalid:

```typescript
import { ConfigurationError } from 'marzban-sdk'

try {
  const sdk = new MarzbanSDK({ /* invalid config */ })
} catch (e) {
  if (e instanceof ConfigurationError) {
    console.log('Configuration error:', e.details)
    // details: Zod validation issues
  }
}
```

**Details:** Zod validation error details with issue descriptions.

#### HttpError

Thrown when HTTP requests fail:

```typescript
import { HttpError } from 'marzban-sdk'

try {
  await sdk.user.getUser('john')
} catch (e) {
  if (e instanceof HttpError) {
    console.log('HTTP error:', e.code, e.details.statusCode)
  }
}
```

**Details:** `{ statusCode: number, response?: unknown, originalError?: Error }`

#### WebhookSignatureError / WebhookValidationError

Thrown when webhook processing fails:

```typescript
import { WebhookSignatureError, WebhookValidationError } from 'marzban-sdk'

try {
  webhook.handleRequest(req)
} catch (e) {
  if (e instanceof WebhookSignatureError) {
    console.log('Invalid webhook signature')
  } else if (e instanceof WebhookValidationError) {
    console.log('Invalid webhook payload:', e.details)
  }
}
```

**Details:** Validation error details or signature mismatch info.

## Error Guards

Error guards are type-safe utility functions to check error types:

```typescript
import {
  isAuthError,
  isConfigError,
  isHttpError,
  isSdkError,
} from 'marzban-sdk'

try {
  await sdk.authorize()
} catch (e) {
  if (isAuthError(e)) {
    // e is narrowed to AuthError
    console.log(e.code) // typed as ErrorCode
  } else if (isHttpError(e)) {
    // e is narrowed to HttpError
    console.log(e.details.statusCode)
  } else if (isSdkError(e)) {
    // e is narrowed to SdkError
    console.log(e.code, e.message)
  }
}
```

### Available Guards

- `isAuthError(error)` – Check if error is `AuthError`
- `isConfigError(error)` – Check if error is `ConfigurationError`
- `isHttpError(error)` – Check if error is `HttpError`
- `isSdkError(error)` – Check if error is any `SdkError`
- `isWebhookError(error)` – Check if error is webhook-related

## Error Handling Patterns

### Pattern 1: Conditional Error Handling

```typescript
async function setupSDK() {
  const sdk = new MarzbanSDK({
    baseUrl: 'https://api.example.com',
    username: 'admin',
    password: 'secret',
    authenticateOnInit: false,
  })

  try {
    await sdk.authorize()
  } catch (e) {
    if (isAuthError(e)) {
      console.error('Invalid credentials')
      process.exit(1)
    } else if (isHttpError(e)) {
      console.error('Network error, retrying...')
      // Implement retry logic
    } else {
      console.error('Unexpected error:', e)
      throw e
    }
  }
}
```

### Pattern 2: Error Details Inspection

```typescript
try {
  const user = await sdk.user.getUser('invalid-user')
} catch (e) {
  if (isSdkError(e)) {
    console.log(`Error [${e.code}]: ${e.message}`)
    console.log('Details:', e.details)
    
    // Handle specific scenarios
    if (e instanceof HttpError && e.details.statusCode === 404) {
      console.log('User not found')
    }
  }
}
```

### Pattern 3: Batch Operations with Error Tracking

```typescript
async function deleteMultipleUsers(usernames: string[]) {
  const results = {
    successful: [] as string[],
    failed: [] as { username: string; error: string }[],
  }

  for (const username of usernames) {
    try {
      await sdk.user.removeUser(username)
      results.successful.push(username)
    } catch (e) {
      results.failed.push({
        username,
        error: isSdkError(e) ? e.message : 'Unknown error',
      })
    }
  }

  return results
}
```

### Pattern 4: Custom Error Handling Middleware

```typescript
function createErrorHandler(logger: Logger) {
  return (error: unknown) => {
    if (isSdkError(error)) {
      logger.error(`[${error.code}] ${error.message}`, {
        code: error.code,
        details: error.details,
      })

      // Send to error tracking service
      if (error instanceof HttpError) {
        sendToErrorTracking({
          type: 'http_error',
          statusCode: error.details.statusCode,
          endpoint: error.details.response?.url,
        })
      }
    } else {
      logger.error('Unhandled error', error)
    }
  }
}

const handleError = createErrorHandler(sdk.logger)

try {
  await sdk.authorize()
} catch (e) {
  handleError(e)
}
```

## Examples

### Complete Authorization with Error Handling

```typescript
import { createMarzbanSDK, isAuthError, isHttpError } from 'marzban-sdk'

async function initializeSDK() {
  try {
    const sdk = await createMarzbanSDK({
      baseUrl: process.env.MARZBAN_URL,
      username: process.env.ADMIN_USER,
      password: process.env.ADMIN_PASS,
    })
    console.log('✓ SDK initialized and authenticated')
    return sdk
  } catch (error) {
    if (isAuthError(error)) {
      console.error('✗ Authentication failed: Invalid credentials')
      console.error('  Check your ADMIN_USER and ADMIN_PASS environment variables')
      process.exit(1)
    }

    if (isHttpError(error)) {
      console.error(`✗ HTTP Error: ${error.details.statusCode}`)
      console.error(`  Failed to reach ${process.env.MARZBAN_URL}`)
      console.error('  Check your MARZBAN_URL environment variable')
      process.exit(1)
    }

    console.error('✗ Unexpected error:', error)
    throw error
  }
}

const sdk = await initializeSDK()
```

### Webhook Signature Verification

```typescript
import { createMarzbanSDK, WebhookSignatureError, WebhookValidationError } from 'marzban-sdk'
import express from 'express'

const app = express()
app.use(express.raw({ type: 'application/json' })) // Keep raw body for signature

const sdk = await createMarzbanSDK({
  baseUrl: process.env.MARZBAN_URL,
  username: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASS,
  webhook: { secret: process.env.WEBHOOK_SECRET },
})

app.post('/webhook', async (req, res) => {
  try {
    // handleWebhook validates signature and parses payload
    await sdk.webhook.handleWebhook(
      req.body,
      req.headers['x-webhook-secret'] as string
    )
    res.status(200).json({ status: 'ok' })
  } catch (e) {
    if (e instanceof WebhookSignatureError) {
      // Log suspicious activity
      console.warn('Invalid webhook signature from', req.ip)
      return res.status(401).json({ error: 'Invalid signature' })
    }

    if (e instanceof WebhookValidationError) {
      // Log malformed payload
      console.warn('Invalid webhook payload:', e.details)
      return res.status(400).json({ error: 'Invalid payload' })
    }

    // Handle other errors
    console.error('Webhook processing error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})
```

## Best Practices

1. **Always use guards for type-safe checking** – Avoid relying on error messages
2. **Provide context in error handlers** – Log with relevant request/operation details
3. **Distinguish between error categories** – Handle auth, network, and validation errors differently
4. **Log error codes** – Use `error.code` for aggregation and monitoring
5. **Inspect details** – Use `error.details` for debugging and error tracking
6. **Avoid error swallowing** – Re-throw or handle appropriately, don't silently ignore
