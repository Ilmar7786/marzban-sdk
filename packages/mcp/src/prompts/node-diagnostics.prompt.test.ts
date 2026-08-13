import { describe, expect, it } from 'vitest'

import { nodeDiagnosticsPrompt } from './node-diagnostics.prompt'

function text(result: ReturnType<typeof nodeDiagnosticsPrompt.handler>): string {
  const content = result.messages[0].content
  return content.type === 'text' ? content.text : ''
}

describe('nodeDiagnosticsPrompt', () => {
  it('targets all nodes when nodeName is omitted', () => {
    expect(text(nodeDiagnosticsPrompt.handler({}))).toContain('Diagnose all nodes.')
  })

  it('targets one node when nodeName is given', () => {
    const body = text(nodeDiagnosticsPrompt.handler({ nodeName: 'node-1' }))
    expect(body).toContain('Diagnose the node "node-1".')
    expect(body).toContain('focus on "node-1"')
  })

  it('mentions the relevant tools and the restart caveat', () => {
    const body = text(nodeDiagnosticsPrompt.handler({}))
    expect(body).toContain('marzban_nodes_list')
    expect(body).toContain('marzban_system_stats')
    expect(body).toContain('marzban_core_restart')
  })
})
