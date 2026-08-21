import { formatBytes, type NodeResponse, type NodeUsageResponse } from 'marzban-sdk'

import type { View } from '@/format/views/types'

export interface NodesList {
  nodes: NodeResponse[]
  usage: NodeUsageResponse[]
}

export const nodesListView: View<NodesList> = {
  compact: ({ nodes, usage }) => {
    const usageByName = new Map(usage.map(u => [u.node_name, u]))
    return nodes.map(node => {
      const nodeUsage = usageByName.get(node.name)
      return {
        name: node.name,
        address: node.address,
        status: node.status,
        message: node.message ?? '',
        xray_version: node.xray_version ?? '',
        uplink: nodeUsage ? formatBytes(nodeUsage.uplink) : '—',
        downlink: nodeUsage ? formatBytes(nodeUsage.downlink) : '—',
      }
    })
  },
}
