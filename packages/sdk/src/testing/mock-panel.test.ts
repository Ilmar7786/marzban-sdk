import http from 'node:http'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebSocket as WsClient } from 'ws'

import type { AnyType } from '@/common/types'

import type { MockPanel } from './mock-panel'
import { startMockPanel } from './mock-panel'

function wsUrl(panel: MockPanel, path: string): string {
  return panel.baseUrl.replace('http://', 'ws://') + path
}

function once<T = void>(client: WsClient, event: string): Promise<T> {
  return new Promise(resolve => client.once(event, ((...args: AnyType[]) => resolve(args[0])) as AnyType))
}

function postLogin(
  panel: MockPanel,
  body = 'username=admin&password=secret'
): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${panel.baseUrl}/api/admin/token`,
      { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' } },
      res => {
        const chunks: Buffer[] = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => {
          resolve({ status: res.statusCode!, json: JSON.parse(Buffer.concat(chunks).toString('utf8')) })
        })
      }
    )
    req.on('error', reject)
    req.end(body)
  })
}

describe('mock-panel', () => {
  let panel: MockPanel

  beforeEach(async () => {
    panel = await startMockPanel()
  })

  afterEach(async () => {
    await panel.stop()
  })

  describe('login endpoint', () => {
    it('accepts a login and returns the default token', async () => {
      const { status, json } = await postLogin(panel)

      expect(status).toBe(200)
      expect(json).toEqual({ access_token: 'mock-access-token', token_type: 'bearer' })
      expect(panel.logins).toEqual([{ username: 'admin', password: 'secret' }])
    })

    it('returns a configured token', async () => {
      panel.setLogin({ mode: 'ok', token: 'custom-token' })

      const { json } = await postLogin(panel)

      expect(json).toMatchObject({ access_token: 'custom-token' })
    })

    it('fails with the default status', async () => {
      panel.setLogin({ mode: 'fail' })

      const { status } = await postLogin(panel)

      expect(status).toBe(401)
    })

    it('fails with a configured status', async () => {
      panel.setLogin({ mode: 'fail', status: 500 })

      const { status } = await postLogin(panel)

      expect(status).toBe(500)
    })

    it('stalls the response until releaseLogin() is called', async () => {
      panel.setLogin({ mode: 'stall' })

      let resolved = false
      const pending = postLogin(panel).then(result => {
        resolved = true
        return result
      })

      await new Promise(resolve => setTimeout(resolve, 30))
      expect(resolved).toBe(false)

      panel.releaseLogin()
      const { status, json } = await pending

      expect(resolved).toBe(true)
      expect(status).toBe(200)
      expect(json).toMatchObject({ access_token: 'mock-access-token' })
    })

    it('throws when releaseLogin() is called with nothing pending', () => {
      expect(() => panel.releaseLogin()).toThrow(/no stalled login request pending/)
    })

    it('returns 404 for a GET request', async () => {
      const status = await new Promise<number>((resolve, reject) => {
        http.get(panel.baseUrl, res => resolve(res.statusCode!)).on('error', reject)
      })
      expect(status).toBe(404)
    })

    it('returns 404 for a POST to an unrelated path', async () => {
      const status = await new Promise<number>((resolve, reject) => {
        const req = http.request(`${panel.baseUrl}/unknown`, { method: 'POST' }, res => resolve(res.statusCode!))
        req.on('error', reject)
        req.end()
      })
      expect(status).toBe(404)
    })
  })

  describe('handshake', () => {
    it('accepts a connection and records the handshake', async () => {
      const client = new WsClient(wsUrl(panel, '/api/core/logs?token=abc&interval=5'))
      await once(client, 'open')

      expect(panel.handshakes).toEqual([
        expect.objectContaining({ pathname: '/api/core/logs', token: 'abc', interval: '5' }),
      ])
      expect(panel.sockets.size).toBe(1)

      client.terminate()
    })

    it('delivers broadcast messages to open sockets', async () => {
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))
      await once(client, 'open')

      const messageArrived = once<Buffer>(client, 'message')
      panel.broadcast('hello from panel')
      const data = await messageArrived

      expect(data.toString('utf8')).toBe('hello from panel')
      client.terminate()
    })

    it('rejects the handshake with the default status before accept()', async () => {
      panel.setHandshake({ mode: 'reject' })
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))

      const err = await once<Error>(client, 'error')

      expect(err.message).toMatch(/403/)
      expect(panel.sockets.size).toBe(0)
    })

    it('rejects the handshake with a configured status', async () => {
      panel.setHandshake({ mode: 'reject', status: 401 })
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))

      const err = await once<Error>(client, 'error')

      expect(err.message).toMatch(/401/)
    })

    it('hangs the handshake until stop() tears it down', async () => {
      panel.setHandshake({ mode: 'hang' })
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))

      let settled = false
      client.once('open', () => (settled = true))
      client.once('error', () => (settled = true))

      await new Promise(resolve => setTimeout(resolve, 50))
      expect(settled).toBe(false)

      client.terminate()
    })

    it('accepts after a delay', async () => {
      panel.setHandshake({ mode: 'delay', ms: 40 })
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))

      const start = Date.now()
      await once(client, 'open')

      expect(Date.now() - start).toBeGreaterThanOrEqual(35)
      client.terminate()
    })

    it('drops connections abruptly with dropAll()', async () => {
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))
      await once(client, 'open')

      const closed = once(client, 'close')
      panel.dropAll()
      await closed
    })

    it('closes connections cleanly with closeAll()', async () => {
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))
      await once(client, 'open')

      const closed = new Promise<[number, Buffer]>(resolve => {
        client.once('close', (code: number, reason: Buffer) => resolve([code, reason]))
      })
      panel.closeAll(1000, 'bye')
      const [code, reason] = await closed

      expect(code).toBe(1000)
      expect(reason.toString('utf8')).toBe('bye')
    })
  })

  describe('waiting helpers', () => {
    it('waitForConnection resolves once a socket is open', async () => {
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))
      const socket = await panel.waitForConnection()

      expect(socket.readyState).toBe(socket.OPEN)
      client.terminate()
    })

    it('waitForConnections resolves once enough sockets have connected', async () => {
      const first = new WsClient(wsUrl(panel, '/api/core/logs'))
      const second = new WsClient(wsUrl(panel, '/api/core/logs'))
      const opened = Promise.all([once(first, 'open'), once(second, 'open')])

      const sockets = await panel.waitForConnections(2)
      await opened

      expect(sockets).toHaveLength(2)
      first.terminate()
      second.terminate()
    })

    it('waitForConnections rejects once the timeout elapses', async () => {
      panel.setHandshake({ mode: 'hang' })
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))
      client.on('error', () => {})

      await expect(panel.waitForConnections(1, 40)).rejects.toThrow(/waitForConnections/)
      client.terminate()
    })

    it('waitForHandshakes resolves once enough handshakes have been recorded', async () => {
      const client = new WsClient(wsUrl(panel, '/api/core/logs'))
      const handshakes = await panel.waitForHandshakes(1)

      expect(handshakes).toHaveLength(1)
      client.terminate()
    })
  })

  it('stop() is idempotent', async () => {
    await panel.stop()
    await panel.stop()
  })
})
