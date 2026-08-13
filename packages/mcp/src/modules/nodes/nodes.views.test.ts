import type { NodeResponse, NodeUsageResponse } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import type { ViewOptions, ViewRow } from '@/format/views/types'

import type { NodesList } from './nodes.views'
import { nodesListView } from './nodes.views'

const HIDE: ViewOptions = { showLinks: false }

function makeNode(overrides: Partial<NodeResponse> = {}): NodeResponse {
  return { id: 1, name: 'node-1', address: '1.2.3.4', status: 'connected', ...overrides }
}

function makeUsage(overrides: Partial<NodeUsageResponse> = {}): NodeUsageResponse {
  return { node_name: 'node-1', uplink: 100, downlink: 200, ...overrides }
}

describe('nodesListView', () => {
  it('joins usage onto the matching node by name', () => {
    const fixture: NodesList = { nodes: [makeNode()], usage: [makeUsage()] }
    const rows = nodesListView.compact(fixture, HIDE) as ViewRow[]

    expect(rows).toEqual([
      {
        name: 'node-1',
        address: '1.2.3.4',
        status: 'connected',
        message: '',
        xray_version: '',
        uplink: '100 B',
        downlink: '200 B',
      },
    ])
  })

  it('falls back to em dashes when a node has no matching usage entry', () => {
    const fixture: NodesList = { nodes: [makeNode({ name: 'node-2' })], usage: [makeUsage({ node_name: 'node-1' })] }
    const rows = nodesListView.compact(fixture, HIDE) as ViewRow[]

    expect(rows[0]).toMatchObject({ uplink: '—', downlink: '—' })
  })

  it('carries through message and xray_version when present', () => {
    const fixture: NodesList = {
      nodes: [makeNode({ message: 'reconnecting', xray_version: '25.1.30' })],
      usage: [],
    }
    const rows = nodesListView.compact(fixture, HIDE) as ViewRow[]

    expect(rows[0]).toMatchObject({ message: 'reconnecting', xray_version: '25.1.30' })
  })
})
