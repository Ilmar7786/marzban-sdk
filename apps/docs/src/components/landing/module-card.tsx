import type { LandingFeature } from '@/config/landing/types'

/** Horizontal card used by the API modules grid. */
export function ModuleCard({ icon: Icon, title, desc }: LandingFeature) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-primary/50">
      <div className="inline-flex shrink-0 rounded-lg border border-fd-border bg-fd-background p-2 text-fd-primary">
        <Icon className="size-4.5" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-0.5 text-sm text-fd-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
