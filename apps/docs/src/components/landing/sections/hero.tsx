import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

import { GithubStarLink } from '@/components/landing/github-star-link'
import { GridBackdrop } from '@/components/landing/grid-backdrop'
import { InstallSection } from '@/components/landing/install-section'
import { appName } from '@/lib/shared'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-fd-border">
      {/* Subtle grid + brand glow */}
      <GridBackdrop maskSize="70% 60%" />
      <div className="glow-brand-from pointer-events-none absolute -left-20 top-0 h-[460px] w-[560px] rounded-full opacity-30 blur-[110px] dark:opacity-40" />
      <div className="glow-brand-to pointer-events-none absolute -right-20 top-10 h-[460px] w-[560px] rounded-full opacity-25 blur-[110px] dark:opacity-35" />

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
          built on it so an AI agent can run your panel directly. Same auth, same retries, same typed errors, so neither
          ever drifts from the other.
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
  )
}
