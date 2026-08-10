import {
  Activity,
  ArrowRight,
  Cpu,
  FileCheck2,
  Globe,
  KeyRound,
  LayoutTemplate,
  PackageCheck,
  Radio,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Webhook,
  Zap,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CodePreview } from '@/components/landing/code-preview'
import { InstallSection } from '@/components/landing/install-section'
import { appName, gitConfig } from '@/lib/shared'

// Only `title`/`description` are overridden here. The Open Graph card (incl.
// the generated image, site name, locale and canonical URL) is inherited from
// the root layout — a partial `openGraph` here would replace it wholesale and
// drop the `opengraph-image` social card.
export const metadata: Metadata = {
  // `absolute` opts out of the root `%s · MarzbanSDK` template — the landing
  // title already leads with the brand, so the suffix would duplicate it.
  title: { absolute: `${appName} — The complete TypeScript SDK for Marzban` },
  description:
    'A complete, production-grade TypeScript SDK for Marzban. Full typed API coverage across users, nodes, subscriptions and admins, plus auto token refresh, retry logic, WebSocket log streaming, Zod validation, webhook verification, and a classified error system — isomorphic for Node.js and the browser.',
}

/** Infrastructure-level capabilities that make this an SDK, not a wrapper. */
const features = [
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
    desc: 'Configurable exponential back-off for transient network failures and WebSocket reconnects — no boilerplate in your code.',
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

/** The typed API modules exposed by the SDK. */
const modules = [
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

const sdkSample = `import { createMarzbanSDK, isAuthError } from 'marzban-sdk'

// One call authenticates and wires up every API module.
// Token refresh and retries are handled for you.
const sdk = await createMarzbanSDK({
  baseUrl: 'https://panel.example.com',
  username: 'admin',
  password: 'secret',
})

// Fully typed API surface: users · nodes · system · subscriptions · …
const { users } = await sdk.user.getUsers({ status: 'active', limit: 10 })
const stats = await sdk.system.getSystemStats()

// Stream real-time logs from the core over WebSocket
const close = await sdk.logs.connectByCore({
  onMessage: (data) => console.log(data),
})

// Typed, narrowable error handling
try {
  await sdk.user.getUserByUsername('does-not-exist')
} catch (err) {
  if (isAuthError(err)) await sdk.authorize()
}`

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      {/* Ambient blurred aurora behind the whole landing */}
      <div className="landing-ambient" aria-hidden />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-fd-border">
        {/* Subtle grid + brand glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--color-fd-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-fd-border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute -left-20 top-0 h-[460px] w-[560px] rounded-full opacity-30 blur-[110px] dark:opacity-40"
          style={{ background: 'radial-gradient(closest-side, var(--brand-from), transparent)' }}
        />
        <div
          className="pointer-events-none absolute -right-20 top-10 h-[460px] w-[560px] rounded-full opacity-25 blur-[110px] dark:opacity-35"
          style={{ background: 'radial-gradient(closest-side, var(--brand-to), transparent)' }}
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:py-32">
          {/* Badge */}
          <span className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3 py-1 text-sm text-fd-muted-foreground">
            <Zap className="size-3.5 text-fd-primary" />
            TypeScript SDK &middot; Node.js &amp; Browser &middot; v3
          </span>

          {/* Heading */}
          <h1
            className="animate-fade-up text-4xl font-bold tracking-tight sm:text-6xl"
            style={{ animationDelay: '60ms' }}
          >
            The complete SDK
            <br />
            for the <span className="brand-gradient-text">Marzban API</span>
          </h1>

          {/* Sub-heading */}
          <p
            className="animate-fade-up mt-6 max-w-2xl text-lg text-fd-muted-foreground"
            style={{ animationDelay: '120ms' }}
          >
            Far more than an API client. {appName} bundles the entire infrastructure layer a serious Marzban integration
            needs — typed endpoints, auto token refresh, retries, WebSocket streaming, webhooks and runtime validation —
            so you ship features, not plumbing.
          </p>

          {/* CTA row */}
          <div
            className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '180ms' }}
          >
            <Link
              href="/docs/get-started/quick-start"
              className="cta-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium hover:scale-[1.03] active:scale-100"
            >
              Get Started <ArrowRight className="size-4" />
            </Link>
            <a
              href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
            >
              <GithubIcon className="size-4" />
              Star on GitHub
            </a>
          </div>

          {/* Install */}
          <div className="animate-fade-up mt-8 w-full" style={{ animationDelay: '240ms' }}>
            <InstallSection />
          </div>

          {/* Trust line */}
          <p className="animate-fade-up mt-6 text-xs text-fd-muted-foreground" style={{ animationDelay: '300ms' }}>
            MIT licensed · Full official Marzban API coverage · Tree-shakeable ESM + CJS
          </p>
        </div>
      </section>

      {/* ── Code preview ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-4xl px-4 py-20">
        <div className="mb-7 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            From install to <span className="brand-gradient-text">full API access</span> in minutes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
            A single function authenticates, configures retries, and exposes every typed API module.
          </p>
        </div>
        <CodePreview code={sdkSample} lang="ts" title="example.ts" />
      </section>

      {/* ── API modules ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">The whole API, fully typed</h2>
          <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
            Nine ready-to-use modules cover everything Marzban exposes — each with complete TypeScript types and
            autocomplete.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-xl border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/50"
            >
              <div className="inline-flex shrink-0 rounded-lg border border-fd-border bg-fd-background p-2 text-fd-primary">
                <Icon className="size-4.5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-0.5 text-sm text-fd-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">A real SDK, not just a wrapper</h2>
          <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
            {appName} ships the reliability features every production Marzban integration needs — so you focus on
            product, not plumbing.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50"
            >
              <div className="mb-4 inline-flex rounded-lg border border-fd-border bg-fd-background p-2.5 text-fd-primary transition-transform group-hover:scale-110">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-fd-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-fd-border">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, var(--brand-from), transparent)' }}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Build your Marzban integration <span className="brand-gradient-text">the right way</span>
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            Read the quick-start guide and have a typed, authenticated client running in a couple of minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/get-started/quick-start"
              className="cta-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium hover:scale-[1.03] active:scale-100"
            >
              Read the docs <ArrowRight className="size-4" />
            </Link>
            <a
              href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
            >
              <GithubIcon className="size-4" />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
