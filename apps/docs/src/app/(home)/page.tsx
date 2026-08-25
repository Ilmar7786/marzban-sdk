import { ArrowRight, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CodePreview } from '@/components/landing/code-preview'
import { InstallSection } from '@/components/landing/install-section'
import { mcpSample, sdkSample } from '@/config/landing/code-samples'
import { features } from '@/config/landing/features'
import { mcpFeatures } from '@/config/landing/mcp-features'
import { modules } from '@/config/landing/modules'
import { appName, gitConfig } from '@/lib/shared'

// Only `title`/`description` are overridden here. The Open Graph card (incl.
// the generated image, site name, locale and canonical URL) is inherited from
// the root layout — a partial `openGraph` here would replace it wholesale and
// drop the `opengraph-image` social card.
export const metadata: Metadata = {
  // `absolute` opts out of the root `%s · MarzbanSDK` template — the landing
  // title already leads with the brand, so the suffix would duplicate it.
  title: { absolute: `${appName} — The Marzban toolkit for code and AI agents` },
  description:
    'The Marzban toolkit: a complete, production-grade TypeScript SDK — full typed API coverage across users, nodes, subscriptions and admins, plus auto token refresh, retry logic, WebSocket log streaming, Zod validation, webhook verification, and a classified error system, isomorphic for Node.js and the browser — and marzban-mcp, an MCP server built on it so Claude, Cursor, or any MCP client can manage a Marzban panel directly.',
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  )
}

/** Small uppercase pill labelling which product a section belongs to. */
function Eyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-semibold tracking-wide text-fd-muted-foreground uppercase">
      {children}
    </span>
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
            TypeScript SDK &middot; MCP Server &middot; Node.js &amp; Browser
          </span>

          {/* Heading */}
          <h1
            className="animate-fade-up text-4xl font-bold tracking-tight sm:text-6xl"
            style={{ animationDelay: '60ms' }}
          >
            The <span className="brand-gradient-text">Marzban toolkit</span>
            <br />
            for code and AI agents
          </h1>

          {/* Sub-heading */}
          <p
            className="animate-fade-up mt-6 max-w-2xl text-lg text-fd-muted-foreground"
            style={{ animationDelay: '120ms' }}
          >
            {appName} bundles two things: a complete typed TypeScript SDK for building your own Marzban integration —
            auth, retries, WebSocket streaming, webhooks, runtime validation — and{' '}
            <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-base">marzban-mcp</code>, an MCP server
            built on it so an AI agent can run your panel directly. Same auth, same retries, same typed errors, so
            neither ever drifts from the other.
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

      {/* ── SDK: code preview ────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-4xl px-4 py-20">
        <div className="mb-7 text-center">
          <Eyebrow>marzban-sdk</Eyebrow>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            From install to <span className="brand-gradient-text">full API access</span> in minutes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
            A single function authenticates, configures retries, and exposes every typed API module.
          </p>
        </div>
        <CodePreview code={sdkSample} lang="ts" title="example.ts" />
      </section>

      {/* ── SDK: API modules ─────────────────────────────────────────── */}
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

      {/* ── SDK: features grid ───────────────────────────────────────── */}
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

      {/* ── MCP: intro + code preview ────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-fd-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--color-fd-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-fd-border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-20">
          <div className="mb-7 text-center">
            <Eyebrow>marzban-mcp</Eyebrow>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Or hand your panel to <span className="brand-gradient-text">an AI agent</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
              Point Claude, Cursor, or any MCP client at your panel with one config block — no custom integration code,
              built on the same SDK above.
            </p>
          </div>
          <CodePreview code={mcpSample} lang="json" title="claude_desktop_config.json" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-fd-muted-foreground">
            <a
              href="https://www.npmjs.com/package/marzban-mcp"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-fd-border bg-fd-card px-3 py-1 hover:bg-fd-accent"
            >
              npx -y marzban-mcp
            </a>
            <a
              href="https://hub.docker.com/r/ilmar7786/marzban-mcp"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-fd-border bg-fd-card px-3 py-1 hover:bg-fd-accent"
            >
              docker pull ilmar7786/marzban-mcp
            </a>
          </div>
        </div>
      </section>

      {/* ── MCP: features grid ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Capable, but never unsupervised</h2>
          <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
            Every safety mechanism below is on by default — an agent can only do what its profile allows, and never
            without your say-so on anything destructive.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mcpFeatures.map(({ icon: Icon, title, desc }) => (
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
        <div className="mt-8 flex justify-center">
          <Link
            href="/docs/mcp-server/overview"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
          >
            Read the MCP server docs <ArrowRight className="size-4" />
          </Link>
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
            Read the SDK quick-start to build in code, or the MCP server docs to wire it up for an AI agent — either way
            you&rsquo;re running the same battle-tested client underneath.
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
