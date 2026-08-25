import type { Metadata } from 'next'

import { FinalCta } from '@/components/landing/sections/final-cta'
import { Hero } from '@/components/landing/sections/hero'
import { McpFeatures } from '@/components/landing/sections/mcp-features'
import { McpIntro } from '@/components/landing/sections/mcp-intro'
import { SdkCode } from '@/components/landing/sections/sdk-code'
import { SdkFeatures } from '@/components/landing/sections/sdk-features'
import { SdkModules } from '@/components/landing/sections/sdk-modules'
import { appName } from '@/lib/shared'

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

      <Hero />
      <SdkCode />
      <SdkModules />
      <SdkFeatures />
      <McpIntro />
      <McpFeatures />
      <FinalCta />
    </main>
  )
}
