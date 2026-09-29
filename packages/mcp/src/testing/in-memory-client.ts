import type { JSONRPCMessage, McpServer } from '@modelcontextprotocol/server'
import { InMemoryTransport, LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/server'

/** A JSON-RPC response envelope, as it appears on the wire: `result` or `error`, never both. */
export type JsonRpcResponse = Record<string, unknown>

export interface InMemoryClient {
  /** Sends one request and resolves with the whole response envelope — a caller that expects success reads `.result`. */
  request: (method: string, params: Record<string, unknown>) => Promise<JsonRpcResponse>
  close: () => Promise<void>
}

/**
 * Drives a real, fully registered server over a linked in-memory transport
 * pair, handshake and all (`initialize` → `notifications/initialized`), and
 * hands back a `request` function. This package depends on the server SDK
 * only — there is no client to borrow — so the four lines of JSON-RPC are
 * written out by hand.
 *
 * Worth the ceremony because it is the only vantage point that sees what a
 * client sees. Everything below it observes the `CallToolResult` this package
 * *returns*; only here does the server SDK's own validation and result
 * projection run first. `tools/call` results in particular are reshaped on
 * the way out (`projectCallToolResult`), and a `structuredContent` that fails
 * the advertised `outputSchema` becomes a protocol error rather than a
 * result — neither is visible to a test that calls a registered handler
 * directly.
 */
export async function connectInMemoryClient(server: McpServer): Promise<InMemoryClient> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  // No guard on the lookup, deliberately: every message the server sends over
  // this pair is a response to a request made here, and a stray one should
  // fail the test that provoked it rather than be swallowed by a branch no
  // test can reach.
  const pending = new Map<number, (response: JsonRpcResponse) => void>()
  clientTransport.onmessage = message => {
    pending.get(Number((message as { id: number }).id))!(message as JsonRpcResponse)
  }

  await clientTransport.start()
  await server.connect(serverTransport)

  let lastId = 0
  const request = async (method: string, params: Record<string, unknown>): Promise<JsonRpcResponse> => {
    const id = ++lastId
    const answered = new Promise<JsonRpcResponse>(resolve => pending.set(id, resolve))
    await clientTransport.send({ jsonrpc: '2.0', id, method, params } as JSONRPCMessage)
    return answered
  }

  await request('initialize', {
    protocolVersion: LATEST_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'in-memory-client', version: '0.0.0' },
  })
  await clientTransport.send({ jsonrpc: '2.0', method: 'notifications/initialized' } as JSONRPCMessage)

  return { request, close: () => clientTransport.close() }
}
