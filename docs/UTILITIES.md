# Helper Utilities 🛠️

MarzbanSDK provides a collection of utility functions for common operations like data size conversion, datetime manipulation, and template variable handling.

## Table of Contents

- [Bytes Utilities](#bytes-utilities)
- [Datetime Utilities](#datetime-utilities)
- [Variables Utilities](#variables-utilities)
- [Examples](#examples)

## Bytes Utilities

Convert between human-readable sizes and bytes.

### `parseSize(size, options?)`

Parse a human-readable size string to bytes.

**Parameters:**

- `size` – Size string (e.g., "1.5GB", "1024", "2 mb") or number
- `options.decimal` – Use decimal (1000) instead of binary (1024) units (default: binary)

**Returns:** `number` – Size in bytes

**Supported Units:**

- `B` – Bytes
- `KB`/`KIB` – Kilobytes
- `MB`/`MIB` – Megabytes
- `GB`/`GIB` – Gigabytes
- `TB`/`TIB` – Terabytes
- `PB`/`PIB` – Petabytes

**Examples:**

```typescript
import { parseSize } from 'marzban-sdk'

parseSize('1GB') // → 1073741824
parseSize('1.5 GB') // → 1610612736
parseSize('500MB') // → 524288000
parseSize('2 tb') // → 2199023255552
parseSize('1024') // → 1024
parseSize(1024) // → 1024

// Decimal (1000 units)
parseSize('1GB', { decimal: true }) // → 1000000000
parseSize('1MB', { decimal: true }) // → 1000000

// Case insensitive
parseSize('2gb') // → 2147483648
parseSize('2 Gb') // → 2147483648
```

### `formatBytes(bytes, options?)`

Format bytes to human-readable size string.

**Parameters:**

- `bytes` – Size in bytes
- `options.decimals` – Decimal places (default: 2)
- `options.decimal` – Use decimal (1000) instead of binary (1024) units

**Returns:** `string` – Formatted size string

**Examples:**

```typescript
import { formatBytes } from 'marzban-sdk'

formatBytes(1073741824) // → "1.00 GB"
formatBytes(1610612736) // → "1.50 GB"
formatBytes(524288000) // → "500.00 MB"
formatBytes(2199023255552) // → "2.00 TB"

// With decimals option
formatBytes(1500000000, { decimals: 1 }) // → "1.4 GB"
formatBytes(1500000000, { decimals: 0 }) // → "1 GB"

// Decimal units
formatBytes(1000000000, { decimal: true }) // → "1.00 GB"
formatBytes(1500000000, { decimal: true }) // → "1.50 GB"
```

### Size Parsing in User Creation

```typescript
import { parseSize } from 'marzban-sdk'

// From user input
const dataLimit = parseSize('10GB') // → 10737418240

await sdk.user.addUser({
  username: 'john',
  data_limit: dataLimit,
  expire: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days
})
```

## Datetime Utilities

Work with dates and time calculations.

### `addToDate(date, options)`

Add time duration components to a date (immutable).

**Parameters:**

- `date` – Date object, ISO string, or timestamp
- `options` – Object with optional fields:
  - `days` – Number of days to add
  - `hours` – Number of hours to add
  - `minutes` – Number of minutes to add
  - `seconds` – Number of seconds to add
  - `ms` – Number of milliseconds to add

**Returns:** `Date` – New date with added duration

**Examples:**

```typescript
import { addToDate, addDays, addHours } from 'marzban-sdk'

const now = new Date()

// Add multiple components
addToDate(now, { days: 30, hours: 5 }) // 30 days and 5 hours
addToDate(now, { days: -7 }) // 7 days ago
addToDate('2024-01-01', { days: 1 }) // Next day
addToDate(1704067200000, { hours: 24 }) // From timestamp

// Specific helpers
addDays(now, 30) // Add 30 days
addHours(now, 5) // Add 5 hours

// For minutes/seconds, use addToDate
addToDate(now, { minutes: 30 }) // Add 30 minutes
addToDate(now, { seconds: 60 }) // Add 60 seconds
```

### `remainingTime(targetDate)`

Calculate remaining time until a target date.

**Parameters:**

- `targetDate` – Target date, ISO string, or timestamp

**Returns:** `Remaining` object with:

- `days` – Complete days remaining
- `hours` – Hours component (0-23)
- `minutes` – Minutes component (0-59)
- `seconds` – Seconds component (0-59)
- `totalMs` – Total milliseconds remaining

**Examples:**

```typescript
import { remainingTime } from 'marzban-sdk'

const expireAt = new Date('2025-12-31')
const remaining = remainingTime(expireAt)

console.log(`${remaining.days} days, ${remaining.hours} hours remaining`)

if (remaining.days < 7) {
  console.log('Expires in less than a week!')
}
```

### `humanRemaining(to, from?)`

Format the remaining time as a compact human-readable string.

**Returns:** `string` – e.g. `"2d 5h 3m 10s"`, `"< 1s"`, or `"expired"` when the target is in the past.

```typescript
import { humanRemaining } from 'marzban-sdk'

humanRemaining(new Date(Date.now() + 90_000)) // → "1m 30s"
humanRemaining(new Date(Date.now() - 1000)) // → "expired"
```

### `toIso(date)`

Format a date as an ISO 8601 string without milliseconds.

```typescript
import { toIso } from 'marzban-sdk'

toIso('2024-01-01T00:00:00.000Z') // → "2024-01-01T00:00:00Z"
```

### Expiration Handling

```typescript
import { addDays, remainingTime } from 'marzban-sdk'

// Set user to expire in 30 days
const expireAt = addDays(new Date(), 30)

await sdk.user.addUser({
  username: 'john',
  expire: Math.floor(expireAt.getTime() / 1000), // Convert to Unix timestamp
})

// Check time until expiration
const user = await sdk.user.getUser('john')
const expireDate = new Date(user.expire * 1000)
const remaining = remainingTime(expireDate)

if (remaining.days <= 3) {
  sendRenewalReminder(user.username, remaining.days)
}
```

## Variables Utilities

Work with Marzban host-settings template variables.

**Reference:** [Marzban Host Settings Variables](https://gozargah.github.io/marzban/en/docs/host-settings)

### `Variable` Enum

Enumeration of supported template variables (without braces).

**Supported Variables:**

- `SERVER_IP` – Master server IPv4 address
- `USERNAME` – User's username/login
- `DATA_USAGE` – Amount of data consumed by the user
- `DATA_LEFT` – Remaining data for the user
- `DATA_LIMIT` – Total data limit for the user
- `DAYS_LEFT` – Remaining days of subscription (integer)
- `TIME_LEFT` – Human-friendly remaining time (days/hours/mins/secs)
- `EXPIRE_DATE` – Expiration date in the Gregorian calendar
- `JALALI_EXPIRE_DATE` – Expiration date in the Jalali calendar
- `STATUS_EMOJI` – User status as an emoji (✅, ⌛️, 🪫, ❌, 🔌)
- `PROTOCOL` – Configuration protocol (e.g., "vless", "vmess", "trojan")
- `TRANSPORT` – Transport type (e.g., "tcp", "ws", "grpc")

**Usage:**

```typescript
import { Variable } from 'marzban-sdk'

const vars: Variable[] = [Variable.SERVER_IP, Variable.USERNAME, Variable.DATA_LEFT]
```

### `varAs(variable)`

Format a variable name as a template token.

**Parameters:**

- `variable` – A `Variable` enum member

**Returns:** `string` – Variable wrapped in braces, precisely typed (e.g. `"{USERNAME}"`)

**Examples:**

```typescript
import { varAs, Variable } from 'marzban-sdk'

varAs(Variable.SERVER_IP) // → "{SERVER_IP}"
varAs(Variable.USERNAME) // → "{USERNAME}"
```

### `VariableBraced` Object

Pre-wrapped template tokens for quick access.

**Examples:**

```typescript
import { VariableBraced } from 'marzban-sdk'

VariableBraced.SERVER_IP // "{SERVER_IP}"
VariableBraced.USERNAME // "{USERNAME}"
VariableBraced.DATA_LEFT // "{DATA_LEFT}"
VariableBraced.PROTOCOL // "{PROTOCOL}"
```

### `varExtract(template)`

Extract variable names from a template string.

**Parameters:**

- `template` – Template string with variables in braces

**Returns:** `string[]` – Array of extracted variable names (without braces)

**Examples:**

```typescript
import { varExtract } from 'marzban-sdk'

varExtract('Hello {USERNAME}!')
// → ['USERNAME']

varExtract('Server: {SERVER_IP}, User: {USERNAME}')
// → ['SERVER_IP', 'USERNAME']

varExtract('No variables here')
// → []
```

### `interpolateTemplateVariables(template, values)`

Replace template variables with actual values.

**Parameters:**

- `template` – Template string with variables
- `values` – Object mapping variable names to values

**Returns:** `string` – Template with variables substituted

**Examples:**

```typescript
import { interpolateTemplateVariables } from 'marzban-sdk'

interpolateTemplateVariables('Welcome {USERNAME}! Your IP: {SERVER_IP}', {
  USERNAME: 'john',
  SERVER_IP: '192.168.1.1',
})
// → "Welcome john! Your IP: 192.168.1.1"

// Partial substitution
interpolateTemplateVariables('{USERNAME}@{SERVER_IP} ({DAYS_LEFT})', {
  USERNAME: 'admin',
  SERVER_IP: '10.0.0.1',
  // DAYS_LEFT is missing, stays as-is
})
// → "admin@10.0.0.1 ({DAYS_LEFT})"
```

## Examples

### Complete User Setup with Calculations

```typescript
import { createMarzbanSDK, parseSize, addDays, formatBytes } from 'marzban-sdk'

async function createUser(config: {
  username: string
  email: string
  dataLimitString: string // "10GB"
  validDays: number // 30
}) {
  const sdk = await createMarzbanSDK({
    baseUrl: process.env.MARZBAN_URL,
    username: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASS,
  })

  // Parse data limit from string
  const dataLimit = parseSize(config.dataLimitString)

  // Calculate expiration date
  const expireDate = addDays(new Date(), config.validDays)
  const expireTimestamp = Math.floor(expireDate.getTime() / 1000)

  // Create user
  const user = await sdk.user.addUser({
    username: config.username,
    email: config.email,
    data_limit: dataLimit,
    expire: expireTimestamp,
  })

  // Log summary
  console.log(`✓ Created ${config.username}`)
  console.log(`  Data: ${formatBytes(dataLimit)}`)
  console.log(`  Expires: ${expireDate.toLocaleDateString()}`)

  return user
}

await createUser({
  username: 'john_doe',
  email: 'john@example.com',
  dataLimitString: '10GB',
  validDays: 30,
})
```

### Host Settings with Template Variables

```typescript
import { VariableBraced, interpolateTemplateVariables } from 'marzban-sdk'

// Define a host pattern with variables
const hostPattern = `${VariableBraced.USERNAME}.${VariableBraced.SERVER_IP}.example.com`

// Later, when serving a user
const userHost = interpolateTemplateVariables(hostPattern, {
  USERNAME: 'john',
  SERVER_IP: '192.168.1.1',
})
// → "john.192.168.1.1.example.com"

// Use in subscription config
const subscriptionUrl = `https://${userHost}:443/subscription`
```

### Webhook Data Usage Tracking

```typescript
import { createMarzbanSDK, formatBytes, remainingTime } from 'marzban-sdk'

const sdk = await createMarzbanSDK({
  baseUrl: process.env.MARZBAN_URL,
  username: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASS,
})

sdk.webhook.on('reached_usage_percent', webhook => {
  const user = webhook.user
  const usedBytes = (user.data_limit * webhook.used_percent) / 100

  console.log(`
    User: ${webhook.username}
    Usage: ${formatBytes(usedBytes)} / ${formatBytes(user.data_limit)}
    Percent: ${webhook.used_percent}%
  `)
})

sdk.webhook.on('reached_days_left', webhook => {
  const user = webhook.user
  const expireDate = new Date(user.expire * 1000)
  const remaining = remainingTime(expireDate)

  console.log(`
    User: ${webhook.username}
    Expires: ${remaining.days}d ${remaining.hours}h left
  `)
})
```

### Configuration with Size Validation

```typescript
import { createMarzbanSDK, parseSize, formatBytes } from 'marzban-sdk'

async function updateUserPlan(username: string, planSizeString: string) {
  const sdk = await createMarzbanSDK({
    baseUrl: process.env.MARZBAN_URL,
    username: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASS,
  })

  try {
    const dataLimit = parseSize(planSizeString)

    if (dataLimit < parseSize('100MB')) {
      throw new Error('Plan too small, minimum 100MB')
    }

    await sdk.user.modifyUser(username, { data_limit: dataLimit })

    console.log(`✓ Updated to ${formatBytes(dataLimit)}`)
  } catch (e) {
    console.error('Plan update failed:', e.message)
  }
}

await updateUserPlan('john', '5GB')
```

## Best Practices

1. **Use parseSize for user input** – Always validate string sizes
2. **Format for display** – Use formatBytes for user-facing output
3. **Work with timestamps** – Use Unix timestamps for API calls
4. **Immutable dates** – All date utilities return new Date objects
5. **Template variables** – Use VariableBraced for consistency
6. **Extract before interpolate** – Validate variables exist before substituting
7. **Handle missing variables** – Decide if unmapped variables should error or remain as-is

## See Also

- [API Documentation](./API_DOCUMENTATION.md) – Data limit and expiration fields
- [Validation Guide](./VALIDATION.md) – Schema validation
- [Marzban Docs](https://gozargah.github.io/marzban/) – Official reference
