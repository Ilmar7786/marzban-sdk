# 📝 Logging in MarzbanSDK

MarzbanSDK supports flexible logger configuration through the `logger` option in the SDK config.

## Default log level (environment-aware)

When you do **not** specify a `level`, the built-in logger picks one based on the
environment:

| Environment     | Default level | Effect                                     |
| --------------- | ------------- | ------------------------------------------ |
| **Development** | `info`        | `info`, `warn`, and `error` are printed    |
| **Production**  | `error`       | only `error` is printed (quiet by default) |

The environment is detected from `process.env.NODE_ENV`:

- Any value other than `'production'` (including unset) is treated as **development**.
- If `process` is unavailable (e.g. some browser/Worker runtimes), **production**
  is assumed — the quieter, safer default.

An explicit `level` always overrides this default:

```ts
// Forces debug output regardless of NODE_ENV
logger: {
  level: 'debug'
}
```

`timestamp` defaults to `true`. Set `logger: false` to disable all output, even
in development.

## Configuration options

- `logger: false`
  - Disables all SDK log output.
- `logger: { level, timestamp }`
  - `level` — `debug | info | warn | error`.
  - `timestamp` — `boolean`; when `true`, each log message includes a timestamp.
- `logger: customLogger`
  - Provide a custom object implementing `debug`, `info`, `warn`, and `error` methods.

## Examples

### Built-in logger

```ts
import { createMarzbanSDK } from 'marzban-sdk'

const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  logger: {
    level: 'debug',
    timestamp: true,
  },
})
```

### Disable logs

```ts
const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  logger: false,
})
```

### Custom logger

```ts
class MyLogger {
  debug(message: string, context?: string) {
    console.debug('[MyLogger]', message, context)
  }

  info(message: string, context?: string) {
    console.info('[MyLogger]', message, context)
  }

  warn(message: string, context?: string) {
    console.warn('[MyLogger]', message, context)
  }

  error(message: string, trace?: unknown, context?: string) {
    console.error('[MyLogger]', message, trace, context)
  }
}

const sdk = await createMarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  logger: new MyLogger(),
})
```

## Tips

- In production, use `logger: false` or `level: 'warn' | 'error'`.
- For debugging, use `level: 'debug'`.
- To integrate with your own log system, implement `debug`, `info`, `warn`, and `error` in a custom logger.
