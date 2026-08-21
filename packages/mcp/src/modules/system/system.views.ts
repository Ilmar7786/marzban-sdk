import { type CoreStats, formatBytes, type ProxyInbound, type SystemStats } from 'marzban-sdk'

import type { View, ViewRow } from '@/format/views/types'

export interface SystemStatsResult {
  system: SystemStats
  core: CoreStats
}

export const systemStatsView: View<SystemStatsResult> = {
  compact: ({ system, core }) => ({
    version: system.version,
    core_version: core.version,
    core_started: core.started,
    cpu: `${system.cpu_usage.toFixed(1)}% / ${system.cpu_cores} cores`,
    memory: `${formatBytes(system.mem_used)} / ${formatBytes(system.mem_total)}`,
    users: `${system.total_user} total, ${system.online_users} online`,
    users_by_status: `active ${system.users_active}, on_hold ${system.users_on_hold}, disabled ${system.users_disabled}, expired ${system.users_expired}, limited ${system.users_limited}`,
    bandwidth_total: `down ${formatBytes(system.incoming_bandwidth)} / up ${formatBytes(system.outgoing_bandwidth)}`,
    bandwidth_speed: `down ${formatBytes(system.incoming_bandwidth_speed)}/s / up ${formatBytes(system.outgoing_bandwidth_speed)}/s`,
  }),
}

export const systemInboundsView: View<Record<string, ProxyInbound[]>> = {
  compact: inbounds => {
    const rows: ViewRow[] = []
    for (const [group, list] of Object.entries(inbounds)) {
      list.forEach(inbound =>
        rows.push({
          group,
          tag: inbound.tag,
          protocol: inbound.protocol,
          network: inbound.network,
          tls: inbound.tls,
          port: inbound.port,
        })
      )
    }
    return rows
  },
}
