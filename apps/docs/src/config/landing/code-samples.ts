export const sdkSample = `import { createMarzbanSDK, isAuthError } from 'marzban-sdk'

// One call authenticates and wires up every API module.
// Token refresh and retries are handled for you.
const sdk = await createMarzbanSDK({
  baseUrl: 'https://panel.example.com',
  username: 'admin',
  password: 'secret',
})

// Fully typed API surface: users · nodes · system · subscriptions · …
const { users } = await sdk.user.getUsers({ status: 'active', limit: 10 })
const stats = await sdk.system.getSystemStats()

// Stream real-time logs from the core over WebSocket — auto-reconnects on drop
const stream = await sdk.logs.connectByCore({
  onMessage: (data) => console.log(data),
})

// Typed, narrowable error handling
try {
  await sdk.user.getUserByUsername('does-not-exist')
} catch (err) {
  if (isAuthError(err)) await sdk.authorize()
}`

export const mcpSample = `{
  "mcpServers": {
    "marzban": {
      "command": "npx",
      "args": ["-y", "marzban-mcp"],
      "env": {
        "MARZBAN_BASE_URL": "https://panel.example.com",
        "MARZBAN_USERNAME": "admin",
        "MARZBAN_PASSWORD": "secret"
      }
    }
  }
}`
