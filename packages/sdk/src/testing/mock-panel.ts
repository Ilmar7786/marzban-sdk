import type { IncomingMessage, ServerResponse } from 'node:http'
import http from 'node:http'
import type { Socket } from 'node:net'

import type { WebSocket as WsSocket } from 'ws'
import { WebSocketServer } from 'ws'

/** One recorded WebSocket handshake request against the mock panel. */
export interface RecordedHandshake {
  pathname: string
  token: string | null
  interval: string | null
  headers: IncomingMessage['headers']
}

/** One recorded `POST /api/admin/token` request against the mock panel. */
export interface RecordedLogin {
  username: string
  password: string
}

export type HandshakePolicy =
  | { mode: 'accept' }
  /** Rejects before `websocket.accept()`, mirroring how uvicorn collapses 4401/4403/4400 into one HTTP status. */
  | { mode: 'reject'; status?: number }
  /** Accepts after a delay — simulates a slow TLS/proxy layer in front of the panel. */
  | { mode: 'delay'; ms: number }
  /** Never responds to the upgrade — simulates a connection stuck in `CONNECTING`. */
  | { mode: 'hang' }

export type LoginPolicy =
  | { mode: 'ok'; token?: string }
  | { mode: 'fail'; status?: number }
  /** Holds the response open until {@link MockPanel.releaseLogin} is called. */
  | { mode: 'stall' }

const DEFAULT_TOKEN = 'mock-access-token'
const DEFAULT_WAIT_TIMEOUT_MS = 2_000
const POLL_INTERVAL_MS = 10

/**
 * A disposable fake Marzban panel for WS module tests: one `http.Server`
 * serving `POST /api/admin/token` and handling every other request as a
 * WebSocket upgrade — structurally mirroring the real panel, where uvicorn
 * authorizes a WS connection before `websocket.accept()` on the same origin.
 *
 * This is not a mock of `WebSocketClient` or `LogsStream` — it's a real
 * socket on loopback, so tests built on it get real event-loop timing
 * instead of the synchronous fake in `logs-stream.test.ts`. It has no
 * knowledge of `LogsStream`'s behavior; policies are named after what a
 * network/panel can actually do (accept, reject, delay, hang, drop).
 */
export interface MockPanel {
  /** `http://127.0.0.1:<port>` — pass as `baseUrl` to `createMarzbanSDK`/`configurationUrlWs`. */
  readonly baseUrl: string
  readonly handshakes: readonly RecordedHandshake[]
  readonly logins: readonly RecordedLogin[]
  /** Currently open server-side sockets (closed ones are removed automatically). */
  readonly sockets: ReadonlySet<WsSocket>
  /** Applies to every upgrade from here on, including ones already in flight. */
  setHandshake(policy: HandshakePolicy): void
  setLogin(policy: LoginPolicy): void
  /** Resolves the oldest pending 'stall' login request. Throws if none is pending. */
  releaseLogin(): void
  /** Resolves once at least `count` connections have ever been accepted (open or since closed). */
  waitForConnections(count: number, timeoutMs?: number): Promise<WsSocket[]>
  waitForConnection(timeoutMs?: number): Promise<WsSocket>
  waitForHandshakes(count: number, timeoutMs?: number): Promise<RecordedHandshake[]>
  /** Sends `data` to every currently open socket. */
  broadcast(data: string): void
  /** Abruptly terminates every currently open socket — a transport-level disconnect, not a protocol close. */
  dropAll(): void
  /** Closes every currently open socket with a normal WebSocket close frame. */
  closeAll(code?: number, reason?: string): void
  /** Tears down hanging upgrades, live sockets, and the server. Idempotent. */
  stop(): Promise<void>
}

export async function startMockPanel(): Promise<MockPanel> {
  const handshakes: RecordedHandshake[] = []
  const logins: RecordedLogin[] = []
  const sockets = new Set<WsSocket>()
  const connectionLog: WsSocket[] = []
  const hangingUpgrades = new Set<Socket>()
  const pendingLoginReleases: Array<() => void> = []

  let handshakePolicy: HandshakePolicy = { mode: 'accept' }
  let loginPolicy: LoginPolicy = { mode: 'ok' }
  let stopped = false

  const wss = new WebSocketServer({ noServer: true })

  function handleLogin(req: IncomingMessage, res: ServerResponse): void {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      const body = new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
      // Only real callers of this fixture are the SDK's own login flow and
      // tests that deliberately drive it the same way — both always send
      // both fields, so a missing field here would be a bug in the caller,
      // not a case to handle gracefully.
      logins.push({ username: body.get('username')!, password: body.get('password')! })

      const respond = () => {
        if (loginPolicy.mode === 'fail') {
          res.writeHead(loginPolicy.status ?? 401, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ detail: 'mock login failure' }))
          return
        }
        const token = loginPolicy.mode === 'ok' ? (loginPolicy.token ?? DEFAULT_TOKEN) : DEFAULT_TOKEN
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ access_token: token, token_type: 'bearer' }))
      }

      if (loginPolicy.mode === 'stall') {
        pendingLoginReleases.push(respond)
        return
      }
      respond()
    })
  }

  const server = http.createServer((req, res) => {
    // Both server callbacks fire only for requests this same process sent
    // (the SDK's own axios/WebSocket clients), which always set `url` — the
    // `string | undefined` in IncomingMessage's type is for the CONNECT-method
    // case, which never occurs here.
    if (req.method === 'POST' && req.url!.startsWith('/api/admin/token')) {
      handleLogin(req, res)
      return
    }
    res.writeHead(404)
    res.end()
  })

  server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = new URL(req.url!, 'http://mock-panel')
    handshakes.push({
      pathname: url.pathname,
      token: url.searchParams.get('token'),
      interval: url.searchParams.get('interval'),
      headers: req.headers,
    })

    const policy = handshakePolicy

    if (policy.mode === 'hang') {
      hangingUpgrades.add(socket)
      socket.once('close', () => hangingUpgrades.delete(socket))
      return
    }

    if (policy.mode === 'reject') {
      socket.end(`HTTP/1.1 ${policy.status ?? 403} Forbidden\r\n\r\n`)
      return
    }

    const accept = () => {
      wss.handleUpgrade(req, socket, head, ws => {
        sockets.add(ws)
        connectionLog.push(ws)
        ws.once('close', () => sockets.delete(ws))
        wss.emit('connection', ws, req)
      })
    }

    if (policy.mode === 'delay') {
      setTimeout(accept, policy.ms)
      return
    }

    accept()
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  // Binding to port 0 on an explicit IPv4 host always yields an AddressInfo —
  // this only guards against a shape that http.Server's own types allow.
  /* istanbul ignore next */
  if (!address || typeof address === 'string') {
    throw new Error('mock panel failed to bind to a TCP port')
  }
  const baseUrl = `http://127.0.0.1:${address.port}`

  async function waitFor<T>(check: () => T | undefined, timeoutMs: number, message: string): Promise<T> {
    const deadline = Date.now() + timeoutMs
    for (;;) {
      const value = check()
      if (value !== undefined) return value
      if (Date.now() >= deadline) throw new Error(message)
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }

  function waitForConnections(count: number, timeoutMs = DEFAULT_WAIT_TIMEOUT_MS): Promise<WsSocket[]> {
    return waitFor(
      () => (connectionLog.length >= count ? connectionLog.slice(0, count) : undefined),
      timeoutMs,
      `waitForConnections: expected ${count}, got ${connectionLog.length}`
    )
  }

  return {
    baseUrl,
    handshakes,
    logins,
    sockets,

    setHandshake(policy) {
      handshakePolicy = policy
    },

    setLogin(policy) {
      loginPolicy = policy
    },

    releaseLogin() {
      const release = pendingLoginReleases.shift()
      if (!release) {
        throw new Error('releaseLogin() called with no stalled login request pending')
      }
      release()
    },

    waitForConnections,

    waitForConnection(timeoutMs = DEFAULT_WAIT_TIMEOUT_MS) {
      return waitForConnections(1, timeoutMs).then(([socket]) => socket!)
    },

    waitForHandshakes(count, timeoutMs = DEFAULT_WAIT_TIMEOUT_MS) {
      return waitFor(
        () => (handshakes.length >= count ? handshakes.slice(0, count) : undefined),
        timeoutMs,
        `waitForHandshakes: expected ${count}, got ${handshakes.length}`
      )
    },

    broadcast(data) {
      sockets.forEach(ws => ws.send(data))
    },

    dropAll() {
      sockets.forEach(ws => ws.terminate())
    },

    closeAll(code, reason) {
      sockets.forEach(ws => ws.close(code, reason))
    },

    async stop() {
      if (stopped) return
      stopped = true

      hangingUpgrades.forEach(socket => socket.destroy())
      hangingUpgrades.clear()
      sockets.forEach(ws => ws.terminate())
      sockets.clear()

      await new Promise<void>(resolve => wss.close(() => resolve()))
      await new Promise<void>(resolve => server.close(() => resolve()))
    },
  }
}
