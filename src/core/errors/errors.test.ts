import { describe, expect, it } from 'vitest'

import { AuthError, AuthTokenError } from './categories/auth.error'
import { ConfigurationError } from './categories/configuration.error'
import { HttpError } from './categories/http.error'
import { WebhookSignatureError, WebhookValidationError } from './categories/webhook.error'
import { ERROR_CODES, ErrorCode } from './codes'
import { isAuthError } from './guards/auth.guard'
import { isConfigurationError } from './guards/configuration.guard'
import { isHttpError } from './guards/http.guard'
import { isSdkError } from './guards/sdk.guard'
import { isWebhookSignatureError, isWebhookValidationError } from './guards/webhook.guard'
import { SdkError } from './sdk.error'

// ─── SdkError ────────────────────────────────────────────────────────────────

describe('SdkError', () => {
  describe('constructor', () => {
    it('sets message from FormatCode', () => {
      const err = new SdkError(ERROR_CODES.LOGGER_INVALID)
      expect(err.message).toBe(ERROR_CODES.LOGGER_INVALID.message)
    })

    it('sets code from FormatCode', () => {
      const err = new SdkError(ERROR_CODES.LOGGER_INVALID)
      expect(err.code).toBe(ERROR_CODES.LOGGER_INVALID.code)
    })

    it('sets name to the class name', () => {
      const err = new SdkError(ERROR_CODES.LOGGER_INVALID)
      expect(err.name).toBe('SdkError')
    })

    it('sets details when provided', () => {
      const details = { reason: 'bad config' }
      const err = new SdkError(ERROR_CODES.CONFIG_INVALID, details)
      expect(err.details).toEqual(details)
    })

    it('details is undefined when not provided', () => {
      const err = new SdkError(ERROR_CODES.CONFIG_INVALID)
      expect(err.details).toBeUndefined()
    })

    it('is an instance of Error', () => {
      expect(new SdkError(ERROR_CODES.AUTH_FAILED)).toBeInstanceOf(Error)
    })

    it('is an instance of SdkError', () => {
      expect(new SdkError(ERROR_CODES.AUTH_FAILED)).toBeInstanceOf(SdkError)
    })

    it('has a stack trace', () => {
      const err = new SdkError(ERROR_CODES.AUTH_FAILED)
      expect(err.stack).toBeDefined()
    })

    it('preserves prototype chain across instanceof checks after serialization boundary', () => {
      const err = new SdkError(ERROR_CODES.AUTH_FAILED)
      expect(Object.getPrototypeOf(err)).toBe(SdkError.prototype)
    })
  })

  describe('fromCode', () => {
    it('creates an instance from a known ErrorCode', () => {
      const err = SdkError.fromCode('AUTH_FAILED')
      expect(err).toBeInstanceOf(SdkError)
      expect(err.code).toBe('AUTH_FAILED')
      expect(err.message).toBe(ERROR_CODES.AUTH_FAILED.message)
    })

    it('passes details through', () => {
      const details = { userId: 42 }
      const err = SdkError.fromCode('AUTH_FAILED', details)
      expect(err.details).toEqual(details)
    })

    it('falls back to code as message for an unknown ErrorCode', () => {
      const unknownCode = 'UNKNOWN_CODE' as ErrorCode
      const err = SdkError.fromCode(unknownCode)
      expect(err.code).toBe('UNKNOWN_CODE')
      expect(err.message).toBe('UNKNOWN_CODE')
    })
  })

  describe('toJSON', () => {
    it('returns an object with name, code, message, details', () => {
      const details = { x: 1 }
      const err = new SdkError(ERROR_CODES.NETWORK_HTTP_ERROR, details)
      expect(err.toJSON()).toEqual({
        name: 'SdkError',
        code: 'NETWORK_HTTP_ERROR',
        message: 'HTTP request failed',
        details: { x: 1 },
      })
    })

    it('details is undefined in JSON when not provided', () => {
      const err = new SdkError(ERROR_CODES.NETWORK_HTTP_ERROR)
      expect(err.toJSON().details).toBeUndefined()
    })
  })
})

// ─── Error categories ────────────────────────────────────────────────────────

describe('AuthError', () => {
  it('is an instance of SdkError and Error', () => {
    const err = new AuthError()
    expect(err).toBeInstanceOf(SdkError)
    expect(err).toBeInstanceOf(Error)
  })

  it('has the correct code', () => {
    expect(new AuthError().code).toBe(ERROR_CODES.AUTH_FAILED.code)
  })

  it('has the correct message', () => {
    expect(new AuthError().message).toBe(ERROR_CODES.AUTH_FAILED.message)
  })

  it('sets name to AuthError', () => {
    expect(new AuthError().name).toBe('AuthError')
  })

  it('passes details through', () => {
    const err = new AuthError({ token: 'x' })
    expect(err.details).toEqual({ token: 'x' })
  })
})

describe('AuthTokenError', () => {
  it('has the correct code', () => {
    expect(new AuthTokenError().code).toBe(ERROR_CODES.AUTH_TOKEN_FAILED.code)
  })

  it('sets name to AuthTokenError', () => {
    expect(new AuthTokenError().name).toBe('AuthTokenError')
  })
})

describe('ConfigurationError', () => {
  it('has the correct code', () => {
    expect(new ConfigurationError().code).toBe(ERROR_CODES.CONFIG_INVALID.code)
  })

  it('sets name to ConfigurationError', () => {
    expect(new ConfigurationError().name).toBe('ConfigurationError')
  })

  it('passes details through', () => {
    const err = new ConfigurationError('bad value')
    expect(err.details).toBe('bad value')
  })
})

describe('HttpError', () => {
  it('has the correct code', () => {
    expect(new HttpError().code).toBe(ERROR_CODES.NETWORK_HTTP_ERROR.code)
  })

  it('sets name to HttpError', () => {
    expect(new HttpError().name).toBe('HttpError')
  })
})

describe('WebhookSignatureError', () => {
  it('has the correct code', () => {
    expect(new WebhookSignatureError().code).toBe(ERROR_CODES.WEBHOOK_SIGNATURE_ERROR.code)
  })

  it('sets name to WebhookSignatureError', () => {
    expect(new WebhookSignatureError().name).toBe('WebhookSignatureError')
  })
})

describe('WebhookValidationError', () => {
  it('has the correct code', () => {
    expect(new WebhookValidationError().code).toBe(ERROR_CODES.WEBHOOK_VALIDATION_ERROR.code)
  })

  it('sets name to WebhookValidationError', () => {
    expect(new WebhookValidationError().name).toBe('WebhookValidationError')
  })
})

// ─── Guards ───────────────────────────────────────────────────────────────────

describe('isSdkError', () => {
  it('returns true for SdkError', () => {
    expect(isSdkError(new SdkError(ERROR_CODES.AUTH_FAILED))).toBe(true)
  })

  it('returns true for subclass instances', () => {
    expect(isSdkError(new AuthError())).toBe(true)
    expect(isSdkError(new HttpError())).toBe(true)
  })

  it('returns false for a plain Error', () => {
    expect(isSdkError(new Error('oops'))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isSdkError(null)).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isSdkError('error')).toBe(false)
  })
})

describe('isAuthError', () => {
  it('returns true for AuthError', () => {
    expect(isAuthError(new AuthError())).toBe(true)
  })

  it('returns false for a different SdkError subclass', () => {
    expect(isAuthError(new HttpError())).toBe(false)
  })

  it('returns false for a plain SdkError', () => {
    expect(isAuthError(new SdkError(ERROR_CODES.AUTH_FAILED))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAuthError(null)).toBe(false)
  })
})

describe('isConfigurationError', () => {
  it('returns true for ConfigurationError', () => {
    expect(isConfigurationError(new ConfigurationError())).toBe(true)
  })

  it('returns false for a different error type', () => {
    expect(isConfigurationError(new AuthError())).toBe(false)
  })

  it('returns false for null', () => {
    expect(isConfigurationError(null)).toBe(false)
  })
})

describe('isHttpError', () => {
  it('returns true for HttpError', () => {
    expect(isHttpError(new HttpError())).toBe(true)
  })

  it('returns false for a different error type', () => {
    expect(isHttpError(new AuthError())).toBe(false)
  })

  it('returns false for null', () => {
    expect(isHttpError(null)).toBe(false)
  })
})

describe('isWebhookSignatureError', () => {
  it('returns true for WebhookSignatureError', () => {
    expect(isWebhookSignatureError(new WebhookSignatureError())).toBe(true)
  })

  it('returns false for WebhookValidationError', () => {
    expect(isWebhookSignatureError(new WebhookValidationError())).toBe(false)
  })

  it('returns false for null', () => {
    expect(isWebhookSignatureError(null)).toBe(false)
  })
})

describe('isWebhookValidationError', () => {
  it('returns true for WebhookValidationError', () => {
    expect(isWebhookValidationError(new WebhookValidationError())).toBe(true)
  })

  it('returns false for WebhookSignatureError', () => {
    expect(isWebhookValidationError(new WebhookSignatureError())).toBe(false)
  })

  it('returns false for null', () => {
    expect(isWebhookValidationError(null)).toBe(false)
  })
})
