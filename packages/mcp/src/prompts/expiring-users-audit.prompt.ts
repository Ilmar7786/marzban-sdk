import { z } from 'zod'

import { definePrompt } from '@/core/prompts'

export const expiringUsersAuditPrompt = definePrompt({
  name: 'expiring_users_audit',
  title: 'Audit expiring users',
  description:
    'Finds users whose subscription is expiring soon (or already expired/limited) and suggests next steps for each.',
  argsSchema: z.object({
    withinDays: z.string().optional().describe('How many days ahead counts as "expiring soon". Defaults to 7.'),
  }),
  handler: ({ withinDays }) => {
    const days = withinDays ?? '7'
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Audit users whose subscription expires within ${days} day(s), or is already expired/limited.

Steps:
1. Call marzban_users_list (use \`search\`/\`offset\` to page through everyone if there are many users — don't assume the first page is everything).
2. For each active or on_hold user, compare their days-left figure against the ${days}-day window (marzban_users_get returns it directly; marzban_users_list's compact view shows expire dates you can also use).
3. Also include any user already in status expired or limited — they're already past due, not just approaching it.
4. Report them grouped by urgency: already expired/limited first, then soonest-to-expire, with username, status, days left, and data usage for each.
5. For each user, suggest a next step — marzban_users_extend to renew, or marzban_users_deactivate if it should not be renewed — but do not call either one yet. Wait for the user to say which accounts to act on.`,
          },
        },
      ],
    }
  },
})
