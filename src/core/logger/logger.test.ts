import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DefaultLogger } from './default-logger'
import { Logger } from './logger.types'
import { isLogger, isLoggerOptions } from './logger.utils'
import { createLogger } from './logger-factory'

// ─── isLogger ────────────────────────────────────────────────────────────────

describe('isLogger', () => {
  it('returns true for an object with all four methods', () => {
    const obj = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    }
    expect(isLogger(obj)).toBe(true)
  })

  it('returns false for null', () => {
    expect(isLogger(null)).toBe(false)
  })

  it('returns false for a plain string', () => {
    expect(isLogger('logger')).toBe(false)
  })

  it('returns false for a number', () => {
    expect(isLogger(42)).toBe(false)
  })

  it('returns false when a method is missing', () => {
    expect(isLogger({ debug: () => {}, info: () => {}, warn: () => {} })).toBe(false)
  })

  it('returns false when a method is not a function', () => {
    expect(isLogger({ debug: 'yes', info: () => {}, warn: () => {}, error: () => {} })).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isLogger({})).toBe(false)
  })

  it('returns true for a DefaultLogger instance', () => {
    expect(isLogger(new DefaultLogger())).toBe(true)
  })

  it('returns true when object has extra properties beyond the four methods', () => {
    const obj = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      extra: 'value',
    }
    expect(isLogger(obj)).toBe(true)
  })
})

// ─── isLoggerOptions ─────────────────────────────────────────────────────────

describe('isLoggerOptions', () => {
  it('returns true for an empty object', () => {
    expect(isLoggerOptions({})).toBe(true)
  })

  it('returns true for { level: "debug" }', () => {
    expect(isLoggerOptions({ level: 'debug' })).toBe(true)
  })

  it('returns true for { timestamp: true }', () => {
    expect(isLoggerOptions({ timestamp: true })).toBe(true)
  })

  it('returns true for both known keys', () => {
    expect(isLoggerOptions({ level: 'warn', timestamp: false })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isLoggerOptions(null)).toBe(false)
  })

  it('returns false for false', () => {
    expect(isLoggerOptions(false)).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isLoggerOptions('info')).toBe(false)
  })

  it('returns false for a DefaultLogger instance (has own keys not in allowedKeys)', () => {
    // DefaultLogger has own enumerable keys: levelPriority, levelColors, currentLevel, timestamp
    // These are not in allowedKeys so isLoggerOptions correctly returns false
    expect(isLoggerOptions(new DefaultLogger())).toBe(false)
  })

  it('returns false when an unknown key is present', () => {
    expect(isLoggerOptions({ level: 'info', foo: 'bar' })).toBe(false)
  })
})

// ─── createLogger ────────────────────────────────────────────────────────────

describe('createLogger', () => {
  it('returns a no-op logger when passed false', () => {
    const logger = createLogger(false)
    expect(() => {
      logger.debug('x')
      logger.info('x')
      logger.warn('x')
      logger.error('x')
    }).not.toThrow()
  })

  it('no-op logger methods do nothing (no console output)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createLogger(false)
    logger.info('hello')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('returns the same instance when passed a custom Logger', () => {
    const custom: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
    expect(createLogger(custom)).toBe(custom)
  })

  it('returns a DefaultLogger when called with no arguments', () => {
    expect(createLogger()).toBeInstanceOf(DefaultLogger)
  })

  it('returns a DefaultLogger when passed undefined', () => {
    expect(createLogger(undefined)).toBeInstanceOf(DefaultLogger)
  })

  it('returns a DefaultLogger when passed valid LoggerOptions', () => {
    expect(createLogger({ level: 'debug', timestamp: false })).toBeInstanceOf(DefaultLogger)
  })

  it('throws SdkError for an invalid config (unknown object shape)', () => {
    // an object that is not a Logger, not LoggerOptions, and not false/undefined
    expect(() => createLogger({ unknownKey: true } as never)).toThrow()
  })
})

// ─── DefaultLogger ────────────────────────────────────────────────────────────

describe('DefaultLogger', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor defaults', () => {
    it('defaults to level "info"', () => {
      const logger = new DefaultLogger()
      logger.debug('hidden')
      expect(debugSpy).not.toHaveBeenCalled()
      logger.info('visible')
      expect(infoSpy).toHaveBeenCalled()
    })

    it('defaults timestamp to true', () => {
      const logger = new DefaultLogger()
      logger.info('msg')
      const output: string = infoSpy.mock.calls[0][0]
      // ISO timestamp pattern
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('log level filtering', () => {
    it('level "debug" allows all messages through', () => {
      const logger = new DefaultLogger({ level: 'debug' })
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')
      expect(debugSpy).toHaveBeenCalledTimes(1)
      expect(infoSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it('level "warn" suppresses debug and info', () => {
      const logger = new DefaultLogger({ level: 'warn' })
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')
      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it('level "error" only allows error through', () => {
      const logger = new DefaultLogger({ level: 'error' })
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')
      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it('level "info" allows info, warn, error but not debug', () => {
      const logger = new DefaultLogger({ level: 'info' })
      logger.debug('d')
      logger.info('i')
      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('output format', () => {
    it('output contains [MarzbanSDK] prefix', () => {
      const logger = new DefaultLogger({ timestamp: false })
      logger.info('hello')
      expect(infoSpy.mock.calls[0][0]).toContain('MarzbanSDK')
    })

    it('output contains the message', () => {
      const logger = new DefaultLogger({ timestamp: false })
      logger.info('my message')
      expect(infoSpy.mock.calls[0][0]).toContain('my message')
    })

    it('output contains the context when provided', () => {
      const logger = new DefaultLogger({ timestamp: false })
      logger.info('msg', 'MyContext')
      expect(infoSpy.mock.calls[0][0]).toContain('MyContext')
    })

    it('output does not contain empty brackets when context is omitted', () => {
      const logger = new DefaultLogger({ timestamp: false })
      logger.info('msg')
      expect(infoSpy.mock.calls[0][0]).not.toContain('[]')
    })

    it('timestamp=false suppresses the ISO timestamp', () => {
      const logger = new DefaultLogger({ timestamp: false })
      logger.info('msg')
      expect(infoSpy.mock.calls[0][0]).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
    })

    it('output has no leading or trailing spaces when timestamp=false and no context', () => {
      const logger = new DefaultLogger({ timestamp: false })
      logger.info('msg')
      // Strip ANSI escape codes before checking whitespace,
      // because chalk wraps text in escape sequences that look like extra chars.
      const raw: string = infoSpy.mock.calls[0][0]
      // eslint-disable-next-line no-control-regex
      const stripped = raw.replace(/\[[0-9;]*m/g, '')
      expect(stripped).toBe(stripped.trim())
    })
  })

  describe('error method', () => {
    it('passes trace as second argument to console.error', () => {
      const logger = new DefaultLogger({ level: 'error' })
      const err = new Error('oops')
      logger.error('failed', err, 'Ctx')
      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), err)
    })

    it('passes empty string when trace is undefined', () => {
      const logger = new DefaultLogger({ level: 'error' })
      logger.error('failed')
      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), '')
    })

    it('accepts a plain string as trace', () => {
      const logger = new DefaultLogger({ level: 'error' })
      logger.error('failed', 'stack trace string')
      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), 'stack trace string')
    })

    it('does not call console.error when level priority blocks it', () => {
      // Directly override currentLevel to a value above 'error' to cover
      // the false-branch of shouldLog('error') — unreachable via LogLevel
      // enum but needed for branch coverage.
      const logger = new DefaultLogger({ level: 'error' })
      ;(logger as unknown as Record<string, unknown>)['currentLevel'] = 'fatal'
      logger.error('suppressed')
      expect(errorSpy).not.toHaveBeenCalled()
    })
  })

  describe('implements Logger interface', () => {
    it('all four methods exist on the instance', () => {
      const logger: Logger = new DefaultLogger()
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
    })
  })
})
