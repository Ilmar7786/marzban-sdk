import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { GithubStarLink } from '@/components/landing/github-star-link'

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-fd-border">
      <div className="glow-brand-from pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl" />
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
  )
}
