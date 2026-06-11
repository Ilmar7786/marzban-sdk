# 📝 Logging in MarzbanSDK

MarzbanSDK supports flexible logger configuration through the `logger` option in the SDK config.

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
