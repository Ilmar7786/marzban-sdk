import { Bot, EyeOff, Filter, KeyRound, ListChecks, ShieldCheck } from 'lucide-react'

import type { LandingFeature } from './types'

/** What makes marzban-mcp safe to hand to a model, not just capable. */
export const mcpFeatures: LandingFeature[] = [
  {
    icon: KeyRound,
    title: 'Env-only credentials',
    desc: 'The panel URL, username and password are never accepted as a tool argument — a compromised or confused model can’t redirect the server elsewhere.',
  },
  {
    icon: Filter,
    title: 'Profile-gated tools',
    desc: 'A tool outside the active profile never appears in tools/list at all, not just hidden behind a hint.',
  },
  {
    icon: ShieldCheck,
    title: 'Confirmation on destructive actions',
    desc: 'The first call only describes the consequences and returns a one-time token; nothing runs until a human-approved second call repeats it.',
  },
  {
    icon: EyeOff,
    title: 'Credentials masked by default',
    desc: 'proxies, subscription_url and links stay hidden unless you explicitly opt in.',
  },
  {
    icon: ListChecks,
    title: '21 tools, 3 prompts',
    desc: 'Full user lifecycle, config, hosts, nodes, system stats and subscriptions, plus ready-made investigations that chain several tools together.',
  },
  {
    icon: Bot,
    title: 'Built on marzban-sdk',
    desc: 'The same typed client, auth and retry behavior as the SDK, just exposed as MCP tools — no drift between them.',
  },
]
