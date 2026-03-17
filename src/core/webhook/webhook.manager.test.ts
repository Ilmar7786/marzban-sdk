/* eslint-disable no-empty */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WebhookSignatureError, WebhookValidationError } from '@/core/errors'
import { Logger } from '@/core/logger'

import { WebhookManager } from './webhook.manager'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('./webhook.utils', () => ({
  validateWebhookPayload: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}))

import { validateWebhookPayload, verifyWebhookSignature } from './webhook.utils'

const mockValidate = vi.mocked(validateWebhookPayload)
const mockVerify = vi.mocked(verifyWebhookSignature)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})

const makePayload = (action = 'user_created') => ({
  action,
  username: 'alice',
  enqueued_at: 0,
  send_at: 0,
  tries: 0,
  by: { username: 'admin' },
  user: { username: 'alice' },
})

// ─── WebhookManager ───────────────────────────────────────────────────────────

describe('WebhookManager', () => {
  let logger: Logger
  let manager: WebhookManager

  beforeEach(() => {
    vi.clearAllMocks()
    logger = makeLogger()
    manager = new WebhookManager({ logger })
  })

  // ─── constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('logs initialization', () => {
      expect(logger.info).toHaveBeenCalledWith('WebhookManager initialized', 'WebhookManager')
    })

    it('creates a manager without a secret', () => {
      expect(() => new WebhookManager({ logger })).not.toThrow()
    })

    it('creates a manager with a secret', () => {
      expect(() => new WebhookManager({ secret: 'mysecret', logger })).not.toThrow()
    })
  })

  // ─── on / once / off ──────────────────────────────────────────────────────

  describe('on', () => {
    it('returns this for chaining', () => {
      const result = manager.on('*', vi.fn())
      expect(result).toBe(manager)
    })

    it('logs listener registration', () => {
      manager.on('*', vi.fn())
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('*'), 'WebhookManager')
    })
  })

  describe('once', () => {
    it('returns this for chaining', () => {
      expect(manager.once('*', vi.fn())).toBe(manager)
    })

    it('logs one-time listener registration', () => {
      manager.once('batch', vi.fn())
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('batch'), 'WebhookManager')
    })
  })

  describe('off', () => {
    it('returns this for chaining', () => {
      const listener = vi.fn()
      manager.on('*', listener)
      expect(manager.off('*', listener)).toBe(manager)
    })

    it('logs listener removal', () => {
      const listener = vi.fn()
      manager.on('*', listener)
      vi.clearAllMocks()
      manager.off('*', listener)
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('*'), 'WebhookManager')
    })
  })

  // ─── parseWebhook ──────────────────────────────────────────────────────────

  describe('parseWebhook', () => {
    describe('without secret', () => {
      it('parses a Buffer body', () => {
        const payload = makePayload()
        mockValidate.mockReturnValue([payload] as never)
        const body = Buffer.from(JSON.stringify([payload]))
        const result = manager.parseWebhook(body)
        expect(result).toEqual([payload])
      })

      it('parses a string body', () => {
        const payload = makePayload()
        mockValidate.mockReturnValue([payload] as never)
        const result = manager.parseWebhook(JSON.stringify([payload]))
        expect(result).toEqual([payload])
      })

      it('passes an already-parsed object directly to validateWebhookPayload', () => {
        const payload = makePayload()
        mockValidate.mockReturnValue([payload] as never)
        manager.parseWebhook([payload])
        expect(mockValidate).toHaveBeenCalledWith([payload])
      })

      it('throws when JSON.parse fails', () => {
        expect(() => manager.parseWebhook('not json')).toThrow(SyntaxError)
      })

      it('logs error when JSON.parse fails', () => {
        try {
          manager.parseWebhook('not json')
        } catch {}
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('parse'),
          expect.any(SyntaxError),
          'WebhookManager'
        )
      })

      it('throws WebhookValidationError when payload is invalid', () => {
        mockValidate.mockImplementation(() => {
          throw new WebhookValidationError()
        })
        expect(() => manager.parseWebhook([{}])).toThrow(WebhookValidationError)
      })

      it('logs validation info with payload count', () => {
        const payload = makePayload()
        mockValidate.mockReturnValue([payload, payload] as never)
        manager.parseWebhook([payload, payload])
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('2'), 'WebhookManager')
      })
    })

    describe('with secret', () => {
      let secretManager: WebhookManager

      beforeEach(() => {
        secretManager = new WebhookManager({ secret: 'topsecret', logger })
        vi.clearAllMocks()
      })

      it('throws WebhookSignatureError when signature is missing', () => {
        expect(() => secretManager.parseWebhook(Buffer.from('[]'))).toThrow(WebhookSignatureError)
      })

      it('logs error when signature is missing', () => {
        try {
          secretManager.parseWebhook(Buffer.from('[]'))
        } catch {}
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('missing'), 'WebhookManager')
      })

      it('throws WebhookSignatureError when body is not Buffer or string', () => {
        expect(() => secretManager.parseWebhook([{}], 'sig')).toThrow(WebhookSignatureError)
      })

      it('logs error when body type is invalid for signature verification', () => {
        try {
          secretManager.parseWebhook([{}], 'sig')
        } catch {}
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('raw'), 'WebhookManager')
      })

      it('throws WebhookSignatureError when signature verification fails', () => {
        mockVerify.mockReturnValue(false)
        expect(() => secretManager.parseWebhook(Buffer.from('[]'), 'badsig')).toThrow(WebhookSignatureError)
      })

      it('logs error when signature verification fails', () => {
        mockVerify.mockReturnValue(false)
        try {
          secretManager.parseWebhook(Buffer.from('[]'), 'badsig')
        } catch {}
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('verification failed'),
          expect.objectContaining({ signature: 'badsig' }),
          'WebhookManager'
        )
      })

      it('proceeds to parse when signature is valid', () => {
        mockVerify.mockReturnValue(true)
        const payload = makePayload()
        mockValidate.mockReturnValue([payload] as never)
        const body = Buffer.from(JSON.stringify([payload]))
        const result = secretManager.parseWebhook(body, 'validsig')
        expect(result).toEqual([payload])
      })

      it('logs debug when signature is verified successfully', () => {
        mockVerify.mockReturnValue(true)
        const payload = makePayload()
        mockValidate.mockReturnValue([payload] as never)
        secretManager.parseWebhook(Buffer.from(JSON.stringify([payload])), 'validsig')
        expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('verified'), 'WebhookManager')
      })

      it('accepts a string body for signature verification', () => {
        mockVerify.mockReturnValue(true)
        const payload = makePayload()
        mockValidate.mockReturnValue([payload] as never)
        const body = JSON.stringify([payload])
        const result = secretManager.parseWebhook(body, 'validsig')
        expect(result).toEqual([payload])
      })
    })
  })

  // ─── handleWebhook ────────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('returns true when batch listener is registered', async () => {
      const payload = makePayload()
      mockValidate.mockReturnValue([payload] as never)
      manager.on('batch', vi.fn())
      const result = await manager.handleWebhook([payload])
      expect(result).toBe(true)
    })

    it('returns true when wildcard listener is registered', async () => {
      const payload = makePayload()
      mockValidate.mockReturnValue([payload] as never)
      manager.on('*', vi.fn())
      const result = await manager.handleWebhook([payload])
      expect(result).toBe(true)
    })

    it('returns true when action-specific listener is registered', async () => {
      const payload = makePayload('user_created')
      mockValidate.mockReturnValue([payload] as never)
      manager.on('user_created' as never, vi.fn())
      const result = await manager.handleWebhook([payload])
      expect(result).toBe(true)
    })

    it('returns false when no listeners are registered', async () => {
      const payload = makePayload()
      mockValidate.mockReturnValue([payload] as never)
      const result = await manager.handleWebhook([payload])
      expect(result).toBe(false)
    })

    it('calls the wildcard listener with each payload', async () => {
      const payload = makePayload()
      mockValidate.mockReturnValue([payload] as never)
      const wildcardListener = vi.fn()
      manager.on('*', wildcardListener)
      await manager.handleWebhook([payload])
      await vi.waitFor(() => expect(wildcardListener).toHaveBeenCalledWith(payload))
    })

    it('calls the batch listener with all payloads', async () => {
      const p1 = makePayload('user_created')
      const p2 = makePayload('user_deleted')
      mockValidate.mockReturnValue([p1, p2] as never)
      const batchListener = vi.fn()
      manager.on('batch', batchListener)
      await manager.handleWebhook([p1, p2])
      await vi.waitFor(() => expect(batchListener).toHaveBeenCalledWith([p1, p2]))
    })

    it('logs error and rethrows when parseWebhook throws', async () => {
      mockValidate.mockImplementation(() => {
        throw new WebhookValidationError()
      })
      await expect(manager.handleWebhook([{}])).rejects.toThrow(WebhookValidationError)
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error handling'),
        expect.any(WebhookValidationError),
        'WebhookManager'
      )
    })

    it('logs completion with emitted status', async () => {
      const payload = makePayload()
      mockValidate.mockReturnValue([payload] as never)
      await manager.handleWebhook([payload])
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('emitted='), 'WebhookManager')
    })
  })

  // ─── dispatch ─────────────────────────────────────────────────────────────

  describe('dispatch', () => {
    it('returns true when listener is registered for the event', async () => {
      const payload = makePayload('user_created')
      manager.on('user_created' as never, vi.fn())
      const result = await manager.dispatch('user_created' as never, payload as never)
      expect(result).toBe(true)
    })

    it('returns false when no listeners are registered', async () => {
      const payload = makePayload('user_deleted')
      const result = await manager.dispatch('user_deleted' as never, payload as never)
      expect(result).toBe(false)
    })

    it('logs dispatch debug and info', async () => {
      const payload = makePayload('user_updated')
      await manager.dispatch('user_updated' as never, payload as never)
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('user_updated'), 'WebhookManager')
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('user_updated'), 'WebhookManager')
    })
  })
})
