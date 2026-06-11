# Webhook Handling 📨

MarzbanSDK provides a powerful webhook system to handle real-time events from Marzban. Webhooks allow you to react to user lifecycle events, data limit changes, subscription modifications, and more.

## Table of Contents

- [Overview](#overview)
- [Webhook Events](#webhook-events)
- [Quick Start](#quick-start)
- [Event Subscription](#event-subscription)
  - [Specific Events](#specific-events)
  - [Wildcard Events](#wildcard-events)
  - [Batch Events](#batch-events)
- [Webhook Processing](#webhook-processing)
  - [Parse Webhook](#parse-webhook)
  - [Handle Webhook](#handle-webhook)
  - [Signature Verification](#signature-verification)
- [Advanced Usage](#advanced-usage)
  - [Custom Implementation](#custom-implementation)
  - [Using Utilities](#using-utilities)
  - [Using Schemas](#using-schemas)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

Webhooks enable your application to respond to events in Marzban:

- **User Lifecycle** – User creation, deletion, updates
- **User Status** – Enable, disable, expiration, limited status
- **Data Usage** – Data limit reached, data reset
- **Subscription** – Subscription revocation

Each webhook includes:

- `action` – Event type (e.g., `user_created`, `user_limited`)
- `username` – Affected user
- `user` – Full user object (when available)
- `by` – Admin who triggered the action (when applicable)
- Metadata (enqueued_at, send_at, tries)

All webhooks are **fully typed** with Zod schemas for validation.

### Accessing Webhooks

Access the webhook manager through the SDK instance:

```typescript
import { createMarzbanSDK } from 'marzban-sdk'

const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
})

// Access webhook manager through sdk.webhook
sdk.webhook.on('user_created', payload => {
  console.log(payload.username)
})
```

## Webhook Events

### User Events

| Event           | Trigger                 | Payload                           |
| --------------- | ----------------------- | --------------------------------- |
| `user_created`  | User is created         | `{ username, user, by }`          |
| `user_updated`  | User is modified        | `{ username, user, by }`          |
| `user_deleted`  | User is deleted         | `{ username, by }`                |
| `user_enabled`  | User is enabled         | `{ username, user, by? }`         |
| `user_disabled` | User is disabled        | `{ username, user, by, reason? }` |
| `user_limited`  | User reaches data limit | `{ username, user }`              |
| `user_expired`  | User reaches expiration | `{ username, user }`              |

### Data Usage Events

| Event                   | Trigger                           | Payload                            |
| ----------------------- | --------------------------------- | ---------------------------------- |
| `data_usage_reset`      | Admin resets user data            | `{ username, user, by }`           |
| `data_reset_by_next`    | User auto-resets via next_plan    | `{ username, user }`               |
| `reached_usage_percent` | User reaches usage threshold      | `{ username, user, used_percent }` |
| `reached_days_left`     | User reaches expiration threshold | `{ username, user, days_left }`    |

### Subscription Events

| Event                  | Trigger                 | Payload                  |
| ---------------------- | ----------------------- | ------------------------ |
| `subscription_revoked` | Subscription is revoked | `{ username, user, by }` |

## Quick Start

### 1. Subscribe to Events

```typescript
import { createMarzbanSDK } from 'marzban-sdk'

const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  webhook: { secret: process.env.WEBHOOK_SECRET },
})

// Subscribe to specific event
sk.webhook.on('user_created', webhook => {
  console.log(`User created: ${webhook.username}`)
})
```

### 2. Handle Incoming Requests

```typescript
import express from 'express'

const app = express()
app.use(express.raw({ type: 'application/json' })) // Keep raw body for signature verification

app.post('/webhook', async (req, res) => {
  try {
    // Parse and validate webhook
    await sdk.webhook.handleWebhook(req.body, req.headers['x-webhook-secret'] as string)
    res.status(200).json({ status: 'received' })
  } catch (e) {
    if (e instanceof WebhookSignatureError) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    if (e instanceof WebhookValidationError) {
      return res.status(400).json({ error: 'Invalid payload' })
    }
    res.status(500).json({ error: 'Internal error' })
  }
})

app.listen(3000)
```

### 3. Signature Configuration

Webhooks can be signed for security. Configure the secret in SDK initialization:

```typescript
const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  webhook: {
    secret: process.env.WEBHOOK_SECRET, // HMAC-SHA256 secret
  },
})
```

**Signature Details:**

- Header: `x-webhook-secret`
- Algorithm: HMAC-SHA256
- Format: Hex-encoded digest
- Timing-safe comparison (prevents timing attacks)

## Event Subscription

### Specific Events

Subscribe to a specific webhook action:

```typescript
// User created event
sdk.webhook.on('user_created', webhook => {
  console.log(`User ${webhook.username} created by ${webhook.by.username}`)
  console.log(`Email: ${webhook.user.email}`)
})

// User limited (data limit reached)
sdk.webhook.on('user_limited', webhook => {
  console.log(`User ${webhook.username} reached data limit`)
})

// User expired
sdk.webhook.on('user_expired', webhook => {
  console.log(`User ${webhook.username} expired`)
})

// Data usage percentage
sdk.webhook.on('reached_usage_percent', webhook => {
  console.log(`User ${webhook.username} at ${webhook.used_percent}%`)
})

// Days left
sdk.webhook.on('reached_days_left', webhook => {
  console.log(`User ${webhook.username} has ${webhook.days_left} days left`)
})
```

### Wildcard Events

Listen to any webhook with the `*` wildcard:

```typescript
sdk.webhook.on('*', webhook => {
  console.log(`Event: ${webhook.action}`)
  console.log(`User: ${webhook.username}`)

  // Handle all events uniformly
})
```

### Batch Events

Process multiple webhooks in one request:

```typescript
// Listen to batch events
sdk.webhook.on('batch', webhooks => {
  console.log(`Processing ${webhooks.length} webhooks`)

  for (const webhook of webhooks) {
    console.log(`- ${webhook.action}: ${webhook.username}`)
  }
})
```

### Multiple Listeners

Attach multiple listeners to the same event:

```typescript
// Logger
sdk.webhook.on('user_created', webhook => {
  logger.info(`User created: ${webhook.username}`)
})

// Analytics
sdk.webhook.on('user_created', webhook => {
  analytics.track('user_created', { username: webhook.username })
})

// Database
sdk.webhook.on('user_created', webhook => {
  db.users.create({ username: webhook.username })
})

// All three listeners fire when webhook is processed
```

## Webhook Processing

The webhook manager provides two methods for processing webhooks:

### Parse Webhook

Parse and validate a webhook payload without emitting events:

```typescript
// Parse webhook
const payloads = sdk.webhook.parseWebhook(req.body, req.headers['x-webhook-secret'] as string)

// Process parsed payloads
for (const payload of payloads) {
  console.log(payload.action, payload.username)
}
```

**Important:**

- If secret is configured, you MUST pass the raw request body (Buffer or string)
- This is necessary for signature verification
- Returns array of validated webhooks
- Throws `WebhookSignatureError` or `WebhookValidationError` on failure

### Handle Webhook

Parse, validate, and emit webhook events:

```typescript
// Handle and emit events
const emitted = await sdk.webhook.handleWebhook(req.body, req.headers['x-webhook-secret'] as string)

if (emitted) {
  console.log('Webhook processed and events emitted')
}
```

**What happens:**

1. Signature verification (if secret configured)
2. Payload validation (Zod schemas)
3. Batch event emission (if multiple payloads)
4. Individual action events emission
5. Wildcard '\*' event emission

## Advanced Usage

### Custom Implementation

You can build your own webhook handler using the provided utilities:

```typescript
import { validateWebhookPayload, verifyWebhookSignature, type WebhookType } from 'marzban-sdk'

async function customWebhookHandler(rawBody: unknown, signature: string, secret: string) {
  // 1. Verify signature
  const isValid = verifyWebhookSignature(signature, secret, rawBody as Buffer)
  if (!isValid) {
    throw new Error('Invalid signature')
  }

  // 2. Validate payload
  const webhooks = validateWebhookPayload(rawBody)

  // 3. Process webhooks
  for (const webhook of webhooks) {
    console.log(`Processing ${webhook.action}`)
  }

  return webhooks
}
```

### Using Utilities

Access webhook utilities for custom implementations:

```typescript
import { validateWebhookPayload, verifyWebhookSignature, toBuffer } from 'marzban-sdk'

// Validate payload
try {
  const payloads = validateWebhookPayload(jsonData)
} catch (e) {
  if (e instanceof WebhookValidationError) {
    console.log('Validation failed:', e.details)
  }
}

// Verify signature
const isValid = verifyWebhookSignature(signatureHeader, secret, toBuffer(rawBody))

if (!isValid) {
  console.log('Signature invalid')
}
```

### Using Schemas

Access Zod schemas for custom implementations:

```typescript
import { WebhookSchema, WebhookArraySchema, UserCreatedSchema, ACTIONS } from 'marzban-sdk'

// Parse single webhook
const webhook = WebhookSchema.parse(webhookData)

// Parse array
const webhooks = WebhookArraySchema.parse(webhooksData)

// Safe parse (doesn't throw)
const result = UserCreatedSchema.safeParse(data)
if (result.success) {
  console.log('Valid user_created webhook:', result.data)
}

// All available actions
Object.values(ACTIONS).forEach(action => {
  console.log(`Action: ${action}`)
})
```

## Error Handling

The webhook manager throws two types of errors:

### WebhookSignatureError

Invalid or missing signature:

```typescript
import { WebhookSignatureError } from 'marzban-sdk'

try {
  await sdk.webhook.handleWebhook(req.body, signature)
} catch (e) {
  if (e instanceof WebhookSignatureError) {
    // Signature verification failed
    logger.warn('Invalid webhook signature from', req.ip)
    return res.status(401).json({ error: 'Invalid signature' })
  }
}
```

### WebhookValidationError

Invalid webhook payload:

```typescript
import { WebhookValidationError } from 'marzban-sdk'

try {
  await sdk.webhook.handleWebhook(req.body, signature)
} catch (e) {
  if (e instanceof WebhookValidationError) {
    // Payload validation failed
    logger.error('Invalid webhook payload', e.details)
    return res.status(400).json({ error: 'Invalid payload' })
  }
}
```

## Examples

### Complete Webhook Server

```typescript
import express from 'express'
import { createMarzbanSDK, WebhookSignatureError, WebhookValidationError } from 'marzban-sdk'

const app = express()
app.use(express.raw({ type: 'application/json' })) // Keep raw body

const sdk = await createMarzbanSDK({
  baseUrl: process.env.MARZBAN_URL,
  username: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASS,
  webhook: { secret: process.env.WEBHOOK_SECRET },
})

// Subscribe to user creation
sk.webhook.on('user_created', webhook => {
  console.log(`✓ New user: ${webhook.username}`)
  console.log(`  Created by: ${webhook.by.username}`)
  console.log(`  Email: ${webhook.user.email}`)
})

// Subscribe to user deletion
sk.webhook.on('user_deleted', webhook => {
  console.log(`✗ User deleted: ${webhook.username}`)
})

// Subscribe to data usage
sk.webhook.on('reached_usage_percent', webhook => {
  console.log(`📊 ${webhook.username}: ${webhook.used_percent}% used`)

  if (webhook.used_percent >= 80) {
    sendNotification(webhook.username, 'Low data warning')
  }
})

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    await sdk.webhook.handleWebhook(req.body, req.headers['x-webhook-secret'] as string)
    res.status(200).json({ status: 'ok' })
  } catch (e) {
    if (e instanceof WebhookSignatureError) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    if (e instanceof WebhookValidationError) {
      return res.status(400).json({ error: 'Invalid payload' })
    }
    res.status(500).json({ error: 'Internal error' })
  }
})

app.listen(3000, () => console.log('Webhook server ready'))
```

### Webhook with Database Sync

```typescript
import { createMarzbanSDK } from 'marzban-sdk'
import db from './database'

const sdk = await createMarzbanSDK({
  /* config */
})

// Sync user creation
sdk.webhook.on('user_created', async webhook => {
  await db.users.create({
    username: webhook.username,
    email: webhook.user.email,
    data_limit: webhook.user.data_limit,
    expire: webhook.user.expire,
  })
})

// Sync user updates
sdk.webhook.on('user_updated', async webhook => {
  await db.users.update(webhook.username, {
    email: webhook.user.email,
    data_limit: webhook.user.data_limit,
    expire: webhook.user.expire,
  })
})

// Sync user deletion
sdk.webhook.on('user_deleted', async webhook => {
  await db.users.delete(webhook.username)
})

// Track usage
sdk.webhook.on('reached_usage_percent', async webhook => {
  await db.usage_alerts.create({
    username: webhook.username,
    percent: webhook.used_percent,
    timestamp: new Date(),
  })
})
```

### Webhook with Notifications

```typescript
import { createMarzbanSDK } from 'marzban-sdk'
import { sendEmail, sendTelegram } from './notifications'

const sdk = await createMarzbanSDK({
  /* config */
})

// Notify on user disabled
sdk.webhook.on('user_disabled', async webhook => {
  const message = `Your account has been disabled${webhook.reason ? ': ' + webhook.reason : '.'}`

  await sendEmail(webhook.user.email, 'Account Disabled', message)
  await sendTelegram(webhook.username, message)
})

// Notify on low quota
sdk.webhook.on('reached_usage_percent', async webhook => {
  if (webhook.used_percent >= 90) {
    const message = `Your data usage is at ${webhook.used_percent}%. 
      Upgrade or wait for reset.`

    await sendEmail(webhook.user.email, '⚠️ Low Data Warning', message)
  }
})

// Notify on expiration soon
sdk.webhook.on('reached_days_left', async webhook => {
  if (webhook.days_left <= 3) {
    const message = `Your subscription expires in ${webhook.days_left} day(s).`

    await sendEmail(webhook.user.email, '🔔 Expiring Soon', message)
    await sendTelegram(webhook.username, message)
  }
})
```

## Best Practices

1. **Keep raw body for signature verification** – Use `express.raw()` middleware
2. **Always configure secret in production** – Enable signature verification
3. **Keep listeners fast** – Move heavy work to async handlers or queues
4. **Log webhook activity** – Track for debugging and monitoring
5. **Handle errors gracefully** – Return appropriate HTTP status codes
6. **Test signature generation** – Use Marzban webhook testing feature
7. **Monitor failures** – Track signature and validation errors
8. **Use async/await** – Handle webhook events asynchronously
9. **Leverage types** – Use TypeScript for type safety
10. **Consider rate limiting** – Prevent webhook processing overload

## Exported Types and Utilities

The webhook module exports everything needed for custom implementations:

**Types:**

- `WebhookType` – Single webhook payload
- `WebhookArrayType` – Array of webhooks
- `WebhookEventMap` – Event listener map
- `WebhookAction` – Action type enum
- `WebhookManagerOptions` – Manager configuration

**Schemas (Zod):**

- `WebhookSchema` – Single webhook validator
- `WebhookArraySchema` – Batch validator
- `UserCreatedSchema`, `UserUpdatedSchema`, etc. – Specific action validators

**Utilities:**

- `validateWebhookPayload()` – Validate webhook payload
- `verifyWebhookSignature()` – Verify HMAC-SHA256 signature
- `ACTIONS` – All available webhook actions

**Errors:**

- `WebhookSignatureError` – Signature verification failed
- `WebhookValidationError` – Payload validation failed

## See Also

- [Error Handling Guide](./ERRORS.md) – WebhookSignatureError and WebhookValidationError
- [Validation Guide](./VALIDATION.md) – Zod schema validation
- [Configuration](../README.md#-configuration-options) – SDK webhook configuration
