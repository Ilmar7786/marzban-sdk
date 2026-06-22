# Validation with Zod 🔒

MarzbanSDK uses **Zod** for runtime type validation of configuration and API payloads. This ensures type safety at both compile-time and runtime.

## Table of Contents

- [Overview](#overview)
- [Configuration Validation](#configuration-validation)
- [Webhook Validation](#webhook-validation)
- [Schema Inference](#schema-inference)
- [Error Handling](#error-handling)
- [Custom Validation](#custom-validation)
- [Examples](#examples)

## Overview

Zod is an integrated schema validation library used throughout MarzbanSDK:

- **Configuration** – All SDK config is validated against a schema
- **Webhooks** – Incoming webhook payloads are validated with discriminated unions
- **API Responses** – Generated API types are based on Zod schemas
- **Type Inference** – Full TypeScript types derived from schemas

Validation happens automatically during initialization and request processing.

## Configuration Validation

When you create an SDK instance, the configuration is validated:

```typescript
import { createMarzbanSDK } from 'marzban-sdk'

const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  retries: 3,
  authenticateOnInit: false,
})
```

**Validation Rules:**

- `baseUrl` – Required, must be a valid URL string
- `username` – Required, non-empty string
- `password` – Required, non-empty string
- `token` – Optional, JWT token string
- `timeout` – Optional, non-negative integer (ms), default 30000 (`0` disables the timeout)
- `retries` – Optional, non-negative integer, default 3
- `authenticateOnInit` – Optional, boolean, default true
- `logger` – Optional, false or LoggerOptions or Logger instance
- `webhook` – Optional, `{ secret?: string }`

**Error Handling:**

```typescript
import { createMarzbanSDK, ConfigurationError } from 'marzban-sdk'

try {
  const sdk = await createMarzbanSDK({
    baseUrl: '', // Invalid: empty URL
    username: 'admin',
    password: 'secret',
  })
} catch (e) {
  if (e instanceof ConfigurationError) {
    console.log('Validation errors:', e.details)
    // details: Array of Zod validation issues
  }
}
```

The `ConfigurationError.details` contains Zod validation issues:

```typescript
{
  code: 'invalid_type',
  expected: 'string',
  received: 'undefined',
  path: ['baseUrl'],
  message: 'Required'
}
```

## Webhook Validation

Incoming webhooks are validated using discriminated union schemas:

```typescript
// Webhooks received via sdk.webhook are validated against WebhookSchema.
// handleWebhook is async and throws WebhookValidationError on invalid payloads
// (and WebhookSignatureError when a configured signature does not match).
await sdk.webhook.handleWebhook(rawBody, signature)
```

> If you construct a `WebhookManager` directly, note that its `logger` option is
> required (the SDK does not expose `sdk.logger`). Pass `false`, `LoggerOptions`,
> or your own `Logger` implementation.

**Webhook Schemas:**

Each webhook action has its own schema:

```typescript
// User created webhook
const schema = UserCreatedSchema
// {
//   action: literal('user_created'),
//   username: string,
//   by: AdminResponse,
//   user: UserResponse,
//   enqueued_at: number,
//   send_at: number,
//   tries: number,
// }

// User limited webhook
const schema = UserLimitedSchema
// {
//   action: literal('user_limited'),
//   username: string,
//   user: UserResponse,
//   enqueued_at: number,
//   send_at: number,
//   tries: number,
// }

// Reached usage percent
const schema = ReachedUsagePercentSchema
// {
//   action: literal('reached_usage_percent'),
//   username: string,
//   user: UserResponse,
//   used_percent: number,
//   enqueued_at: number,
//   send_at: number,
//   tries: number,
// }
```

**Discriminated Union:**

Webhooks use Zod's `z.discriminatedUnion` on the `action` field:

```typescript
export const WebhookSchema = z.discriminatedUnion('action', [
  UserCreatedSchema,
  UserUpdatedSchema,
  UserDeletedSchema,
  UserLimitedSchema,
  UserExpiredSchema,
  UserEnabledSchema,
  UserDisabledSchema,
  UserDataUsageResetSchema,
  UserDataResetByNextSchema,
  UserSubscriptionRevokedSchema,
  ReachedUsagePercentSchema,
  ReachedDaysLeftSchema,
])
```

This ensures:

- Correct shape for each action
- Type narrowing in event listeners
- Fast validation (discriminator matched first)

## Schema Inference

TypeScript types are automatically inferred from Zod schemas:

```typescript
import { WebhookType } from 'marzban-sdk'

// WebhookType is z.infer<typeof WebhookSchema>
// Includes all possible webhook shapes, union-typed by action

const webhook: WebhookType = {
  action: 'user_created',
  username: 'john',
  by: {
    /* admin */
  },
  user: {
    /* user data */
  },
  enqueued_at: 1234567890,
  send_at: 1234567890,
  tries: 0,
}

// Type narrowing works with action field
if (webhook.action === 'user_created') {
  // Here, webhook is narrowed to UserCreatedSchema shape
  const by = webhook.by // type: AdminResponse
  const user = webhook.user // type: UserResponse
}
```

### Webhook Event Map

The `WebhookEventMap` provides precise typing for event listeners:

```typescript
import { WebhookEventMap } from 'marzban-sdk'

type UserCreatedPayload = WebhookEventMap['user_created']
// {
//   action: 'user_created',
//   username: string,
//   by: AdminResponse,
//   user: UserResponse,
//   enqueued_at: number,
//   send_at: number,
//   tries: number,
// }

type UserLimitedPayload = WebhookEventMap['user_limited']
// {
//   action: 'user_limited',
//   username: string,
//   user: UserResponse,
//   enqueued_at: number,
//   send_at: number,
//   tries: number,
// }

// Wildcard: any single webhook
type AnyWebhook = WebhookEventMap['*']

// Batch: array of webhooks
type BatchWebhooks = WebhookEventMap['batch']
```

## Error Handling

Validation errors are caught and wrapped in SDK error types:

### Configuration Validation Error

```typescript
import { createMarzbanSDK, ConfigurationError } from 'marzban-sdk'

try {
  const sdk = await createMarzbanSDK({
    /* invalid */
  })
} catch (e) {
  if (e instanceof ConfigurationError) {
    const issues = e.details
    for (const issue of issues) {
      console.log(`${issue.path.join('.')}: ${issue.message}`)
    }
  }
}
```

### Webhook Validation Error

```typescript
import { WebhookValidationError } from 'marzban-sdk'

try {
  await sdk.webhook.handleWebhook(rawBody, signature)
} catch (e) {
  if (e instanceof WebhookValidationError) {
    // details: Zod validation error
    const validation = e.details
    console.log('Validation failed:', validation)
  }
}
```

## Custom Validation

You can extend validation with custom logic:

```typescript
import { z } from 'zod/v4'

// Create custom schema
const customUserSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
})

// Parse and validate
try {
  const user = customUserSchema.parse({
    username: 'john',
    email: 'john@example.com',
    role: 'user',
  })
} catch (e) {
  // Zod (v4) exposes issues on the ZodError
  console.log('Validation error:', (e as z.ZodError).issues)
}

// Safe parse (doesn't throw)
const result = customUserSchema.safeParse(data)
if (result.success) {
  console.log('Valid:', result.data)
} else {
  console.log('Invalid:', result.error.issues)
}
```

## Examples

### Validate User Input Before Submission

```typescript
import { z } from 'zod/v4'

const userInputSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/),
  email: z.string().email().optional(),
  data_limit: z.string().transform(val => parseSize(val)), // Custom transform
  expire: z.number().positive().optional(),
})

const input = {
  username: 'john_doe',
  email: 'john@example.com',
  data_limit: '10GB',
  expire: 1735689600,
}

const result = userInputSchema.safeParse(input)
if (result.success) {
  // Safe to submit to SDK
  await sdk.user.addUser({
    username: result.data.username,
    email: result.data.email,
    data_limit: result.data.data_limit,
    expire: result.data.expire,
  })
} else {
  // Show validation errors
  for (const issue of result.error.issues) {
    console.error(`${issue.path.join('.')}: ${issue.message}`)
  }
}
```

### Create Typed Webhook Handler

```typescript
import { z } from 'zod/v4'
import type { WebhookEventMap } from 'marzban-sdk'

const handlers = {
  user_created: async (webhook: WebhookEventMap['user_created']) => {
    // Full type safety here
    console.log(`Created: ${webhook.by.username} -> ${webhook.user.username}`)
    await db.audit_log.create({
      action: 'user_created',
      admin: webhook.by.username,
      user: webhook.user.username,
      timestamp: new Date(),
    })
  },

  user_disabled: async (webhook: WebhookEventMap['user_disabled']) => {
    // Reason is optional here
    console.log(`Disabled: ${webhook.username} (${webhook.reason ?? 'no reason'})`)
  },

  reached_usage_percent: async (webhook: WebhookEventMap['reached_usage_percent']) => {
    // used_percent is guaranteed number
    const threshold = webhook.used_percent >= 90 ? 'critical' : 'warning'
    await notifyUser(webhook.username, `Usage at ${webhook.used_percent}%`, threshold)
  },
}

webhookManager.on('user_created', handlers.user_created)
webhookManager.on('user_disabled', handlers.user_disabled)
webhookManager.on('reached_usage_percent', handlers.reached_usage_percent)
```

### Config Validation Wrapper

```typescript
import { createMarzbanSDK, ConfigurationError } from 'marzban-sdk'

async function initializeSDK(config: Record<string, unknown>) {
  try {
    const sdk = await createMarzbanSDK(config)
    return { success: true, sdk }
  } catch (e) {
    if (e instanceof ConfigurationError) {
      const errors = e.details.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return { success: false, errors }
    }
    throw e
  }
}

// Usage
const result = await initializeSDK({
  baseUrl: process.env.MARZBAN_URL,
  username: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASS,
})

if (!result.success) {
  console.error('Configuration validation failed:')
  result.errors.forEach(e => {
    console.error(`  ${e.field}: ${e.message}`)
  })
  process.exit(1)
} else {
  console.log('✓ Configuration valid')
  const sdk = result.sdk
}
```

## Best Practices

1. **Trust validation** – Let Zod validate, don't bypass schemas
2. **Use type inference** – Let TypeScript infer types from schemas
3. **Handle validation errors** – Catch and respond appropriately
4. **Extend schemas carefully** – Add custom validators when needed
5. **Use safeParse** – For user input, use `safeParse` instead of `parse`
6. **Type narrow** – Use action field or type guards for precise types
7. **Validate early** – Validate configuration on SDK init, webhooks on receipt

## See Also

- [Error Handling Guide](./ERRORS.md) – ConfigurationError and WebhookValidationError
- [Webhook Guide](./WEBHOOK.md) – Webhook validation details
- [Zod Documentation](https://zod.dev) – Official Zod docs
