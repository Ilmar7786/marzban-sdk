import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { FeatureCard } from '@/components/landing/feature-card'
import { SectionHeader } from '@/components/landing/section-header'
import { mcpFeatures } from '@/config/landing/mcp-features'

export function McpFeatures() {
  return (
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
  )
}
