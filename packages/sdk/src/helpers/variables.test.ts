import { describe, expect, it } from 'vitest'

import {
  BracedVariable,
  interpolateTemplateVariables,
  varAs,
  varExtract,
  Variable,
  VariableBraced,
  varValidate,
} from './variables'

describe('Variable', () => {
  it('contains expected members', () => {
    expect(Variable.USERNAME).toBe('USERNAME')
    expect(Variable.SERVER_IP).toBe('SERVER_IP')
    expect(Variable.TIME_LEFT).toBe('TIME_LEFT')
  })

  it('all enum values are uppercase strings matching their key', () => {
    for (const [key, value] of Object.entries(Variable)) {
      expect(value).toBe(key)
    }
  })
})

describe('varAs', () => {
  it('wraps a variable in braces', () => {
    expect(varAs(Variable.USERNAME)).toBe('{USERNAME}')
  })

  it('works for every enum member', () => {
    for (const v of Object.values(Variable)) {
      expect(varAs(v)).toBe(`{${v}}`)
    }
  })

  it('return type is a precise BracedVariable literal, not plain string', () => {
    // TypeScript compile-time check: assignable to BracedVariable<Variable.USERNAME>
    const token: BracedVariable<typeof Variable.USERNAME> = varAs(Variable.USERNAME)
    expect(token).toBe('{USERNAME}')
  })
})

describe('VariableBraced', () => {
  it('contains pre-braced tokens for every variable', () => {
    for (const v of Object.values(Variable)) {
      expect(VariableBraced[v]).toBe(`{${v}}`)
    }
  })

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(VariableBraced)).toBe(true)
  })

  it('USERNAME token equals varAs result', () => {
    expect(VariableBraced[Variable.USERNAME]).toBe(varAs(Variable.USERNAME))
  })

  it('each value has a precise literal type (BracedVariable), not plain string', () => {
    // TypeScript compile-time check: assignable to the literal type
    const token: BracedVariable<typeof Variable.SERVER_IP> = VariableBraced[Variable.SERVER_IP]
    expect(token).toBe('{SERVER_IP}')
  })
})

describe('varExtract', () => {
  it('returns empty array for an empty string', () => {
    expect(varExtract('')).toEqual([])
  })

  it('returns empty array for a string with no tokens', () => {
    expect(varExtract('hello world')).toEqual([])
  })

  it('extracts a single variable', () => {
    expect(varExtract('{USERNAME}')).toEqual(['USERNAME'])
  })

  it('extracts multiple variables in order of appearance', () => {
    expect(varExtract('{USERNAME} {SERVER_IP}')).toEqual(['USERNAME', 'SERVER_IP'])
  })

  it('extracts variables mixed with plain text', () => {
    expect(varExtract('hello {USERNAME}, ip: {SERVER_IP}')).toEqual(['USERNAME', 'SERVER_IP'])
  })

  it('extracts unknown variable names (not limited to enum)', () => {
    expect(varExtract('{FOO_BAR}')).toEqual(['FOO_BAR'])
  })

  it('does not match tokens with spaces inside braces', () => {
    expect(varExtract('{ USERNAME }')).toEqual([])
  })

  it('does not match empty braces', () => {
    expect(varExtract('{}')).toEqual([])
  })

  it('does not match braces containing hyphens', () => {
    expect(varExtract('{FOO-BAR}')).toEqual([])
  })

  // Documenting current behaviour: duplicates are preserved.
  // varExtract returns one entry per occurrence, not per unique variable.
  it('returns duplicates when the same variable appears multiple times', () => {
    expect(varExtract('{USERNAME} {USERNAME}')).toEqual(['USERNAME', 'USERNAME'])
  })

  it('extracts all known variables when all are present in a template', () => {
    const all = Object.values(Variable)
      .map(v => `{${v}}`)
      .join(' ')
    expect(varExtract(all)).toEqual(Object.values(Variable))
  })
})

describe('varValidate', () => {
  it('returns isValid=true and empty unknownVariables for an empty string', () => {
    expect(varValidate('')).toEqual({ isValid: true, unknownVariables: [] })
  })

  it('returns isValid=true when all variables are known', () => {
    const result = varValidate('{USERNAME} {SERVER_IP}')
    expect(result.isValid).toBe(true)
    expect(result.unknownVariables).toEqual([])
  })

  it('returns isValid=false and lists unknown variables', () => {
    const result = varValidate('{USERNAME} {FOO}')
    expect(result.isValid).toBe(false)
    expect(result.unknownVariables).toEqual(['FOO'])
  })

  it('reports multiple unknown variables', () => {
    const result = varValidate('{FOO} {BAR}')
    expect(result.isValid).toBe(false)
    expect(result.unknownVariables).toEqual(['FOO', 'BAR'])
  })

  it('returns isValid=true for a template with no tokens', () => {
    expect(varValidate('no tokens here').isValid).toBe(true)
  })

  it('returns isValid=true when every enum member is used', () => {
    const all = Object.values(Variable)
      .map(v => `{${v}}`)
      .join(' ')
    expect(varValidate(all).isValid).toBe(true)
  })

  // Documenting current behaviour: duplicates are NOT deduplicated in unknownVariables.
  // If {FOO} appears twice, unknownVariables will contain "FOO" twice.
  it('duplicated unknown variable appears twice in unknownVariables', () => {
    const result = varValidate('{FOO} {FOO}')
    expect(result.isValid).toBe(false)
    expect(result.unknownVariables).toEqual(['FOO', 'FOO'])
  })

  // Same issue for known variables — duplicates in extraction do not affect isValid.
  it('duplicated known variable does not affect isValid', () => {
    expect(varValidate('{USERNAME} {USERNAME}').isValid).toBe(true)
  })
})

describe('interpolateTemplateVariables', () => {
  it('returns empty string unchanged', () => {
    expect(interpolateTemplateVariables('', {})).toBe('')
  })

  it('substitutes a single variable', () => {
    expect(interpolateTemplateVariables('{USERNAME}', { [Variable.USERNAME]: 'alice' })).toBe('alice')
  })

  it('substitutes multiple variables', () => {
    expect(
      interpolateTemplateVariables('{USERNAME} / {SERVER_IP}', {
        [Variable.USERNAME]: 'bob',
        [Variable.SERVER_IP]: '1.2.3.4',
      })
    ).toBe('bob / 1.2.3.4')
  })

  it('leaves unmatched tokens intact when value is missing', () => {
    expect(
      interpolateTemplateVariables('{USERNAME} {DATA_LEFT}', {
        [Variable.USERNAME]: 'alice',
      })
    ).toBe('alice {DATA_LEFT}')
  })

  it('leaves unknown tokens intact', () => {
    expect(interpolateTemplateVariables('{UNKNOWN_TOKEN}', { [Variable.USERNAME]: 'alice' })).toBe('{UNKNOWN_TOKEN}')
  })

  it('substitutes the same variable token multiple times', () => {
    expect(
      interpolateTemplateVariables('{USERNAME} and {USERNAME}', {
        [Variable.USERNAME]: 'carol',
      })
    ).toBe('carol and carol')
  })

  it('works with an empty values map — leaves all tokens intact', () => {
    expect(interpolateTemplateVariables('{USERNAME}', {})).toBe('{USERNAME}')
  })

  it('does not substitute when value is explicitly undefined in values map', () => {
    const values = { [Variable.USERNAME]: undefined } as Partial<Record<Variable, string>>
    expect(interpolateTemplateVariables('{USERNAME}', values)).toBe('{USERNAME}')
  })

  it('substitutes a value that is an empty string', () => {
    expect(interpolateTemplateVariables('{USERNAME}', { [Variable.USERNAME]: '' })).toBe('')
  })

  it('preserves surrounding text unchanged', () => {
    expect(interpolateTemplateVariables('Hello, {USERNAME}!', { [Variable.USERNAME]: 'dave' })).toBe('Hello, dave!')
  })

  it('template with no tokens is returned as-is', () => {
    expect(interpolateTemplateVariables('no tokens', { [Variable.USERNAME]: 'x' })).toBe('no tokens')
  })
})
