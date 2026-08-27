/** Anything closeable — matches `BaseWebSocketClient` structurally, without importing it. */
interface Closeable {
  close(): void
}

/** Closes `client`, collecting rather than propagating a throw from `close()` itself. */
export const closeQuietly = (client: Closeable): unknown[] => {
  try {
    client.close()
    return []
  } catch (error) {
    return [error]
  }
}
