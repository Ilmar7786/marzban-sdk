import { Activity, Cpu, KeyRound, LayoutTemplate, PackageCheck, Radio, Server, Users, Webhook } from 'lucide-react'

import type { LandingFeature } from './types'

/** The typed API modules exposed by the SDK. */
export const modules: LandingFeature[] = [
  { icon: Users, title: 'Users', desc: 'Create, update, reset and inspect users and their traffic.' },
  { icon: Server, title: 'Nodes', desc: 'Manage and monitor connected Marzban nodes.' },
  { icon: Activity, title: 'System', desc: 'Live stats, host info and core configuration.' },
  { icon: Cpu, title: 'Core', desc: 'Control and restart the Xray core, read its config.' },
  { icon: PackageCheck, title: 'Subscriptions', desc: 'Resolve subscription links and per-client configs.' },
  { icon: LayoutTemplate, title: 'User templates', desc: 'Reusable templates for provisioning users.' },
  { icon: KeyRound, title: 'Admins', desc: 'Manage admin accounts and permissions.' },
  { icon: Radio, title: 'Logs', desc: 'WebSocket log streams from the core and nodes.' },
  { icon: Webhook, title: 'Webhooks', desc: 'Verify and handle inbound Marzban events.' },
]
