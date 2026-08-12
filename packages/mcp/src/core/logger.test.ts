import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createStderrLogger } from './logger'

describe('createStderrLogger', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    writeSpy.mockRestore()
  })

  it('writes to stderr, never stdout', () => {
    const logger = createStderrLogger('debug')
    logger.info('hello')
    expect(writeSpy).toHaveBeenCalledTimes(1)
    expect(writeSpy.mock.calls[0][0]).toContain('INFO')
    expect(writeSpy.mock.calls[0][0]).toContain('hello')
  })

  it('includes the context tag when provided', () => {
    const logger = createStderrLogger('debug')
    logger.warn('careful', 'MyContext')
    expect(writeSpy.mock.calls[0][0]).toContain('[MyContext] careful')
  })

  it('omits messages below the configured level', () => {
    const logger = createStderrLogger('warn')
    logger.debug('noisy')
    logger.info('still noisy')
    expect(writeSpy).not.toHaveBeenCalled()
  })

  it('logs at or above the configured level', () => {
    const logger = createStderrLogger('warn')
    logger.warn('at threshold')
    logger.error('above threshold')
    expect(writeSpy).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['debug', 4],
    ['info', 3],
    ['warn', 2],
    ['error', 1],
  ] as const)('level %s allows %d of the four calls through', (level, expectedCalls) => {
    const logger = createStderrLogger(level)
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(writeSpy).toHaveBeenCalledTimes(expectedCalls)
  })

  it('formats an Error with its stack', () => {
    const logger = createStderrLogger('error')
    const err = new Error('boom')
    logger.error('failed', err)
    expect(writeSpy.mock.calls[0][0]).toContain('failed:')
    expect(writeSpy.mock.calls[0][0]).toContain(err.stack)
  })

  it('falls back to the message when an Error has no stack', () => {
    const logger = createStderrLogger('error')
    const err = new Error('no stack here')
    err.stack = undefined
    logger.error('failed', err)
    expect(writeSpy.mock.calls[0][0]).toContain('failed: no stack here')
  })

  it('formats a non-Error thrown value via JSON.stringify', () => {
    const logger = createStderrLogger('error')
    logger.error('failed', { reason: 'bad' })
    expect(writeSpy.mock.calls[0][0]).toContain('{"reason":"bad"}')
  })

  it('falls back to String() when a thrown value is not JSON-serializable', () => {
    const logger = createStderrLogger('error')
    const circular: Record<string, unknown> = {}
    circular.self = circular
    logger.error('failed', circular)
    expect(writeSpy.mock.calls[0][0]).toContain('failed: [object Object]')
  })

  it('logs error() with no err argument using just the message', () => {
    const logger = createStderrLogger('error')
    logger.error('plain failure')
    expect(writeSpy.mock.calls[0][0]).toContain('ERROR plain failure')
    expect(writeSpy.mock.calls[0][0]).not.toContain('undefined')
  })
})
