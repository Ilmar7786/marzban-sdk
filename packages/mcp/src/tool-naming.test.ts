import { describe, expect, it } from 'vitest'

import { allTools } from './modules'

/**
 * Pins the naming schema every tool name has to follow:
 * `marzban_<area>_<verb>(_<noun>)?` — an action verb, never a bare noun.
 *
 * Glama's automated MCP-server review scored Naming Consistency 4/5 because
 * four tools broke this pattern (`marzban_subscription_info`,
 * `marzban_system_inbounds`, `marzban_system_stats`, `marzban_users_usage`)
 * — fixed in #114 by renaming them to `_get`/`_get_<noun>` forms. This test
 * exists so the *next* noun-style tool fails loudly in CI with a clear
 * reason, instead of waiting for another external review to notice.
 *
 * No back-compat aliases are registered for renamed tools (see #114's
 * rationale: every registered tool is serialized into `tools/list` on every
 * connection, so an alias is a permanent cost paid by everyone to save a
 * handful of callers a one-time rename) — this test only pins the *shape* of
 * live names, not history.
 */

// Exhaustive on purpose: an unlisted verb should fail the test rather than
// silently pass, so adding a genuinely new verb is a deliberate edit here.
const ALLOWED_VERBS = [
  'get',
  'list',
  'create',
  'update',
  'delete',
  'activate',
  'deactivate',
  'hold',
  'extend',
  'restart',
  'reset',
  'revoke',
] as const

const TOOL_NAME_PATTERN = new RegExp(`^marzban_[a-z]+_(?:${ALLOWED_VERBS.join('|')})(?:_[a-z]+)*$`)

describe('tool naming schema', () => {
  it.each(allTools.map(tool => tool.name))('%s follows marzban_<area>_<verb>(_<noun>)?', name => {
    expect(name).toMatch(TOOL_NAME_PATTERN)
  })

  it('covers every registered tool (sanity check against an empty allTools)', () => {
    expect(allTools.length).toBeGreaterThan(0)
  })
})
