import type { ProxyHost } from 'marzban-sdk'

import type { View, ViewRow } from '@/format/views/types'

import type { CoreConfigSummary, HostVariableWarning, KeyDiff } from './config.helpers'

export interface ConfigGetResult {
  mode: 'summary' | 'section' | 'raw'
  section: string | null
  summary: CoreConfigSummary | null
  data: unknown
}

function summaryRows(summary: CoreConfigSummary): ViewRow[] {
  return [
    { section: 'inbounds', count: summary.inbounds.length },
    ...summary.inbounds.map(i => ({ tag: i.tag ?? '(untagged)', port: i.port ?? '', protocol: i.protocol ?? '' })),
    { section: 'outbounds', count: summary.outbounds.length },
    ...summary.outbounds.map(o => ({ tag: o.tag ?? '(untagged)', protocol: o.protocol ?? '' })),
    { section: 'routing', rules: summary.routingRulesCount ?? 0 },
    { other_top_level_keys: summary.otherTopLevelKeys.join(', ') || '(none)' },
  ]
}

export const configGetView: View<ConfigGetResult> = {
  compact: result => {
    if (result.mode === 'summary' && result.summary) return summaryRows(result.summary)
    return { mode: result.mode, section: result.section ?? '(all)', json: JSON.stringify(result.data) }
  },
}

export interface ConfigUpdateResult {
  applied: boolean
  restarted: boolean
  diff: KeyDiff
  backup: Record<string, unknown> | null
}

export const configUpdateView: View<ConfigUpdateResult> = {
  compact: result => ({
    applied: result.applied,
    restarted: result.restarted,
    added: result.diff.addedKeys.join(', ') || '(none)',
    removed: result.diff.removedKeys.join(', ') || '(none)',
    changed: result.diff.changedKeys.join(', ') || '(none)',
  }),
}

export const coreRestartView: View<{ restarted: true }> = {
  compact: result => ({ restarted: result.restarted }),
}

export interface HostsGetResult {
  hosts: Record<string, ProxyHost[]>
  warnings: HostVariableWarning[]
}

export const hostsGetView: View<HostsGetResult> = {
  compact: result => {
    const rows: ViewRow[] = []
    for (const [inboundTag, list] of Object.entries(result.hosts)) {
      list.forEach((host, index) =>
        rows.push({
          inbound_tag: inboundTag,
          index,
          remark: host.remark,
          address: host.address,
          disabled: !!host.is_disabled,
        })
      )
    }
    if (result.warnings.length > 0) {
      rows.push({
        warning: `${result.warnings.length} host field(s) reference an unknown template variable — see structuredContent.warnings for details`,
      })
    }
    return rows
  },
}

export interface HostsUpdateResult {
  hosts: Record<string, ProxyHost[]>
  backup: Record<string, ProxyHost[]>
}

export const hostsUpdateView: View<HostsUpdateResult> = {
  compact: result => {
    const tags = Object.keys(result.hosts)
    return { inbound_tags_updated: tags.length, tags: tags.join(', ') || '(none)' }
  },
}
