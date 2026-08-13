import { describe, expect, it } from 'vitest'

import { expiringUsersAuditPrompt } from './expiring-users-audit.prompt'

function text(result: ReturnType<typeof expiringUsersAuditPrompt.handler>): string {
  const content = result.messages[0].content
  return content.type === 'text' ? content.text : ''
}

describe('expiringUsersAuditPrompt', () => {
  it('defaults withinDays to 7 when omitted', () => {
    const result = expiringUsersAuditPrompt.handler({})
    expect(text(result)).toContain('within 7 day(s)')
  })

  it('uses the given withinDays', () => {
    const result = expiringUsersAuditPrompt.handler({ withinDays: '14' })
    expect(text(result)).toContain('within 14 day(s)')
  })

  it('mentions the relevant tools', () => {
    const result = expiringUsersAuditPrompt.handler({})
    const body = text(result)
    expect(body).toContain('marzban_users_list')
    expect(body).toContain('marzban_users_extend')
    expect(body).toContain('marzban_users_deactivate')
  })
})
