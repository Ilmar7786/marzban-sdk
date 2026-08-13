import { defineTool } from '@/core/define-tool'

import { diffTopLevelKeys, summarizeCoreConfig, validateHostTemplates } from './config.helpers'
import {
  configGetInputSchema,
  configGetOutputSchema,
  configUpdateInputSchema,
  configUpdateOutputSchema,
  coreRestartInputSchema,
  coreRestartOutputSchema,
  hostsGetInputSchema,
  hostsGetOutputSchema,
  hostsUpdateInputSchema,
  hostsUpdateOutputSchema,
} from './config.schemas'
import { configGetView, configUpdateView, coreRestartView, hostsGetView, hostsUpdateView } from './config.views'

export const configGetTool = defineTool({
  name: 'marzban_config_get',
  title: 'Get core config',
  description:
    'Reads the Xray core configuration. Defaults to a structural summary (inbound/outbound tags, ports, protocols, routing rule count) — the full config can be tens of KB and this is usually all that\'s needed. Pass `section` (e.g. "inbounds") for one key\'s raw JSON, or `section: "raw"` for the entire config.',
  inputSchema: configGetInputSchema,
  outputSchema: configGetOutputSchema,
  scope: 'read',
  view: configGetView,
  handler: async (args, ctx) => {
    const config = await ctx.sdk.core.getCoreConfig()
    if (args.section === 'raw') return { mode: 'raw' as const, section: null, summary: null, data: config }
    if (args.section) {
      return { mode: 'section' as const, section: args.section, summary: null, data: config[args.section] ?? null }
    }
    return { mode: 'summary' as const, section: null, summary: summarizeCoreConfig(config), data: null }
  },
})

export const configUpdateTool = defineTool({
  name: 'marzban_config_update',
  title: 'Replace core config',
  description:
    'Overwrites the entire Xray core configuration and restarts the core — this is the single most disruptive operation on the whole panel, dropping every active connection while it restarts. Replaces the config wholesale, not a patch. Set `dryRun: true` first to preview the diff against the current config without writing or restarting anything (no confirmation needed for a dry run). Requires confirmation for a real write.',
  inputSchema: configUpdateInputSchema,
  outputSchema: configUpdateOutputSchema,
  scope: 'destructive',
  view: configUpdateView,
  skipConfirm: args => args.dryRun === true,
  describeConsequences: async (args, ctx) => {
    // Best-effort diff, not a precondition for confirming — see the same
    // reasoning on marzban_users_delete's describeConsequences.
    try {
      const current = await ctx.sdk.core.getCoreConfig()
      const diff = diffTopLevelKeys(current, args.config)
      return `This will overwrite the entire core (Xray) configuration and RESTART THE CORE — every active connection across all nodes will drop while it restarts. Top-level sections added: ${diff.addedKeys.join(', ') || 'none'}; removed: ${diff.removedKeys.join(', ') || 'none'}; changed: ${diff.changedKeys.join(', ') || 'none'}. The current config is returned as "backup" in the response so it can be restored manually if needed.`
    } catch {
      return 'This will overwrite the entire core (Xray) configuration and RESTART THE CORE — every active connection across all nodes will drop while it restarts. This cannot be undone. (Could not fetch the current config to show a diff here.)'
    }
  },
  handler: async (args, ctx) => {
    const current = await ctx.sdk.core.getCoreConfig()
    const diff = diffTopLevelKeys(current, args.config)
    if (args.dryRun) return { applied: false, restarted: false, diff, backup: null }
    await ctx.sdk.core.modifyCoreConfig(args.config)
    return { applied: true, restarted: true, diff, backup: current }
  },
})

export const coreRestartTool = defineTool({
  name: 'marzban_core_restart',
  title: 'Restart core',
  description:
    'Restarts the Xray core and every connected node, dropping all active connections. Use marzban_config_update instead if the goal is to apply a config change — it restarts the core as part of applying, so a separate restart is rarely needed. Requires confirmation.',
  inputSchema: coreRestartInputSchema,
  outputSchema: coreRestartOutputSchema,
  scope: 'destructive',
  view: coreRestartView,
  describeConsequences: () =>
    'This will restart the Xray core immediately, dropping every active connection across all nodes. This cannot be undone.',
  handler: async (_args, ctx) => {
    await ctx.sdk.core.restartCore()
    return { restarted: true as const }
  },
})

export const hostsGetTool = defineTool({
  name: 'marzban_hosts_get',
  title: 'Get proxy hosts',
  description:
    'Lists proxy host settings grouped by inbound tag. Flags host fields (remark/address/host/sni/path) that reference an unknown `{VARIABLE}` template token — almost always a typo, since Marzban leaves unknown tokens un-substituted rather than erroring.',
  inputSchema: hostsGetInputSchema,
  outputSchema: hostsGetOutputSchema,
  scope: 'read',
  view: hostsGetView,
  handler: async (_args, ctx) => {
    const hosts = await ctx.sdk.system.getHosts()
    return { hosts, warnings: validateHostTemplates(hosts) }
  },
})

export const hostsUpdateTool = defineTool({
  name: 'marzban_hosts_update',
  title: 'Replace proxy hosts',
  description:
    'Overwrites the entire proxy host configuration (all inbound tags at once) — this replaces the whole map, not a per-tag patch, so include every tag you want to keep. May change subscription links/configs for affected users. Requires confirmation.',
  inputSchema: hostsUpdateInputSchema,
  outputSchema: hostsUpdateOutputSchema,
  scope: 'destructive',
  view: hostsUpdateView,
  describeConsequences: async args => {
    const tags = Object.keys(args.hosts)
    return `This will overwrite proxy host settings for inbound tag(s): ${tags.join(', ') || '(none)'}. Any tag not included here is removed entirely. Existing subscription links/configs may change for affected users. This cannot be undone automatically (the current hosts are returned as "backup" in the response).`
  },
  handler: async (args, ctx) => {
    const backup = await ctx.sdk.system.getHosts()
    const hosts = await ctx.sdk.system.modifyHosts(args.hosts)
    return { hosts, backup }
  },
})
