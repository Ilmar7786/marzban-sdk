import { describe, expect, it } from 'vitest'

import { trafficReportPrompt } from './traffic-report.prompt'

function text(result: ReturnType<typeof trafficReportPrompt.handler>): string {
  const content = result.messages[0].content
  return content.type === 'text' ? content.text : ''
}

describe('trafficReportPrompt', () => {
  it('reports "(all-time)" and no usage-args hint when neither start nor end is given', () => {
    const body = text(trafficReportPrompt.handler({}))
    expect(body).toContain('report (all-time).')
    expect(body).toContain('marzban_nodes_list for per-node')
  })

  it('reports the range and passes only start through when only start is given', () => {
    const body = text(trafficReportPrompt.handler({ start: '2026-01-01' }))
    expect(body).toContain('for 2026-01-01 through (no upper bound)')
    expect(body).toContain('pass the same start/end: 2026-01-01)')
  })

  it('reports the range and passes only end through when only end is given', () => {
    const body = text(trafficReportPrompt.handler({ end: '2026-02-01' }))
    expect(body).toContain('for (no lower bound) through 2026-02-01')
    expect(body).toContain('pass the same start/end: 2026-02-01)')
  })

  it('reports the full range and passes both through when start and end are given', () => {
    const body = text(trafficReportPrompt.handler({ start: '2026-01-01', end: '2026-02-01' }))
    expect(body).toContain('for 2026-01-01 through 2026-02-01')
    expect(body).toContain('pass the same start/end: 2026-01-01 / 2026-02-01)')
  })

  it('mentions the relevant tools', () => {
    const body = text(trafficReportPrompt.handler({}))
    expect(body).toContain('marzban_system_stats')
    expect(body).toContain('marzban_users_usage')
  })
})
