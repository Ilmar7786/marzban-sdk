import {
  FileCheck2,
  Globe,
  KeyRound,
  PackageCheck,
  Radio,
  RefreshCw,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Webhook,
} from 'lucide-react'

import type { LandingFeature } from './types'

/** Infrastructure-level capabilities that make the SDK an SDK, not a wrapper. */
export const features: LandingFeature[] = [
  {
    icon: Sparkles,
    title: 'End-to-end type safety',
    desc: 'Every endpoint, parameter and response is fully typed. Autocomplete covers the entire Marzban API surface — typed against the official OpenAPI spec.',
  },
  {
    icon: Globe,
    title: 'Isomorphic by design',
    desc: 'One package, identical API in Node.js and the browser. Ships dual ESM + CJS builds, is side-effect free, and tree-shakes cleanly.',
  },
  {
    icon: KeyRound,
    title: 'Flexible auth control',
    desc: 'Authenticate automatically on init, pass an existing JWT, or take full manual control. Every mode is fully type-safe.',
  },
  {
    icon: RefreshCw,
    title: 'Auto token refresh',
    desc: 'Expired sessions are renewed transparently behind the scenes. Your application code never has to handle a 401.',
  },
  {
    icon: RotateCcw,
    title: 'Built-in retry logic',
    desc: 'Configurable exponential back-off for transient network failures, plus a full reconnect state machine for WebSocket log streams — no boilerplate in your code.',
  },
  {
    icon: ShieldAlert,
    title: 'Classified error system',
    desc: 'Errors carry structured codes and are narrowed with type guards, so you handle auth, network and validation failures precisely.',
  },
  {
    icon: FileCheck2,
    title: 'Runtime Zod validation',
    desc: 'Configuration and payloads are validated at runtime. Misconfigured clients fail fast with clear, actionable messages.',
  },
  {
    icon: Radio,
    title: 'Real-time log streaming',
    desc: 'Stream live logs from the Marzban core or any node over WebSocket, with automatic reconnection built in.',
  },
  {
    icon: Webhook,
    title: 'Webhooks, batteries included',
    desc: 'HMAC-SHA256 signature verification, typed event subscriptions and wildcard handlers for inbound Marzban events.',
  },
  {
    icon: ScrollText,
    title: 'Structured logging',
    desc: 'Environment-aware logger out of the box — verbose in dev, quiet in production — or plug in your own logging stack.',
  },
  {
    icon: PackageCheck,
    title: 'Helpful utilities',
    desc: 'First-class helpers for byte conversions, datetime math and subscription template variables — common chores, solved.',
  },
  {
    icon: ShieldCheck,
    title: 'Production-hardened',
    desc: 'Timeouts, cancellation and defensive defaults are baked in. Built and tested for real workloads, not just demos.',
  },
]
