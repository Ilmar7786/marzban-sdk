import type { LandingFeature } from '@/config/landing/types'

/** Vertical card used by both the SDK features grid and the MCP features grid. */
export function FeatureCard({ icon: Icon, title, desc }: LandingFeature) {
  return (
    <div className="group rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50">
      <div className="mb-4 inline-flex rounded-lg border border-fd-border bg-fd-background p-2.5 text-fd-primary transition-transform group-hover:scale-110">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-fd-muted-foreground">{desc}</p>
    </div>
  )
}
