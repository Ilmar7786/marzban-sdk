import { McpServer } from '@modelcontextprotocol/server'

import { createConfirmFn } from './core/confirm'
import { createDedupFn } from './core/idempotency'
import { registerPrompts } from './core/prompts'
import type { ToolContext } from './core/tool'
import { registerTools } from './core/tool'
import { allTools } from './modules'
import { allPrompts } from './prompts'

export interface McpServerInfo {
  name: string
  version: string
}

// The cheapest lever this server has over model behavior (plan §9.2) — read
// once at the start of a session, unlike a per-tool description that only
// surfaces when that one tool is actually being considered.
const SERVER_INSTRUCTIONS = `This server manages a Marzban VPN panel. A few rules:
- Prefer marzban_users_get (by username) or marzban_users_list's \`search\` filter over listing every user — the full list is paginated for a reason.
- \`proxies\`, \`subscription_url\`, and \`links\` are access credentials, not display data. Don't paste them into chat unless the user explicitly asks to see them and the server has been configured to reveal them (they're masked by default).
- Before a real marzban_config_update, call it once with \`dryRun: true\` and show the user the diff. Only send the real write after they've seen it and agreed — it restarts the core and drops every connection.
- A destructive tool's first response describes what it would do and includes a confirmToken. Only repeat the call with that token after the user has given their own, unprompted "yes" — the token being available is not itself permission.
- Confirming a destructive call only covers that exact tool and those exact arguments. A different target, or a wider version of the same call (e.g. adding \`all: true\`), needs its own confirmation.
- If a destructive tool reports that its outcome is unknown, do not call it again. Check the current state with a read-only tool and tell the user what you find.
- For multi-step investigations (expiring subscriptions, node health, bandwidth), check whether a prompt already covers it (expiring_users_audit, node_diagnostics, traffic_report) before improvising a tool sequence by hand.`

// tools/list is fully determined by MARZBAN_MCP_PROFILE/_TOOLS_ALLOW/_TOOLS_DENY,
// all fixed at process startup — it cannot change for the life of this server
// instance, so a long TTL costs nothing (plan §5: "прямая экономия на prompt
// cache"). `private`, not `public`: this is a single-tenant stdio server, and
// the spec's `public` scope implies a value shareable across clients, which
// isn't a claim to make here even though it would be harmless in practice.
const TOOLS_LIST_CACHE_TTL_MS = 3_600_000

export function createMarzbanMcpServer(info: McpServerInfo, ctx: ToolContext): McpServer {
  const server = new McpServer(info, {
    capabilities: { tools: {}, prompts: {} },
    instructions: SERVER_INSTRUCTIONS,
    cacheHints: { 'tools/list': { ttlMs: TOOLS_LIST_CACHE_TTL_MS, cacheScope: 'private' } },
  })
  // A fresh confirm strategy per server instance — its signing key and
  // trustedTools set are meant to live and die with the server (plan §6.1).
  // The dedup store follows the same policy: a restarted server has no memory
  // of what a previous run executed, and must not pretend otherwise.
  registerTools({ server, tools: allTools, ctx, confirm: createConfirmFn(), dedup: createDedupFn() })
  registerPrompts(server, allPrompts)
  return server
}
