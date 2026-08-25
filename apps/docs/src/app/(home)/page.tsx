import { ArrowRight, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CodePreview } from '@/components/landing/code-preview'
import { FeatureCard } from '@/components/landing/feature-card'
import { GithubStarLink } from '@/components/landing/github-star-link'
import { GridBackdrop } from '@/components/landing/grid-backdrop'
import { InstallSection } from '@/components/landing/install-section'
import { ModuleCard } from '@/components/landing/module-card'
import { SectionHeader } from '@/components/landing/section-header'
import { mcpSample, sdkSample } from '@/config/landing/code-samples'
import { features } from '@/config/landing/features'
import { mcpFeatures } from '@/config/landing/mcp-features'
import { modules } from '@/config/landing/modules'
import { appName, mcpDockerImage, mcpNpmPackage } from '@/lib/shared'

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

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      {/* Ambient blurred aurora behind the whole landing */}
      <div className="landing-ambient" aria-hidden />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-fd-border">
        {/* Subtle grid + brand glow */}
        <GridBackdrop maskSize="70% 60%" />
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
            <GithubStarLink />
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
        <div className="mb-7">
          <SectionHeader
            eyebrow="marzban-sdk"
            title={
              <>
                From install to <span className="brand-gradient-text">full API access</span> in minutes
              </>
            }
            lead="A single function authenticates, configures retries, and exposes every typed API module."
          />
        </div>
        <CodePreview code={sdkSample} lang="ts" title="example.ts" />
      </section>

      {/* ── SDK: API modules ─────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="mb-10">
          <SectionHeader
            title="The whole API, fully typed"
            lead="Nine ready-to-use modules cover everything Marzban exposes — each with complete TypeScript types and autocomplete."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(mod => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </div>
      </section>

      {/* ── SDK: features grid ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="mb-12">
          <SectionHeader
            title="A real SDK, not just a wrapper"
            lead={`${appName} ships the reliability features every production Marzban integration needs — so you focus on product, not plumbing.`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(feature => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* ── MCP: intro + code preview ────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-fd-border">
        <GridBackdrop maskSize="60% 60%" />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-20">
          <div className="mb-7">
            <SectionHeader
              eyebrow="marzban-mcp"
              title={
                <>
                  Or hand your panel to <span className="brand-gradient-text">an AI agent</span>
                </>
              }
              lead="Point Claude, Cursor, or any MCP client at your panel with one config block — no custom integration code, built on the same SDK above."
            />
          </div>
          <CodePreview code={mcpSample} lang="json" title="claude_desktop_config.json" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-fd-muted-foreground">
            <a
              href={`https://www.npmjs.com/package/${mcpNpmPackage}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-fd-border bg-fd-card px-3 py-1 hover:bg-fd-accent"
            >
              npx -y {mcpNpmPackage}
            </a>
            <a
              href={`https://hub.docker.com/r/${mcpDockerImage}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-fd-border bg-fd-card px-3 py-1 hover:bg-fd-accent"
            >
              docker pull {mcpDockerImage}
            </a>
          </div>
        </div>
      </section>

      {/* ── MCP: features grid ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="mb-12">
          <SectionHeader
            title="Capable, but never unsupervised"
            lead="Every safety mechanism below is on by default — an agent can only do what its profile allows, and never without your say-so on anything destructive."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mcpFeatures.map(feature => (
            <FeatureCard key={feature.title} {...feature} />
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
            <GithubStarLink />
          </div>
        </div>
      </section>
    </main>
  )
}
