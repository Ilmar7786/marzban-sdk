import { FeatureCard } from '@/components/landing/feature-card'
import { SectionHeader } from '@/components/landing/section-header'
import { features } from '@/config/landing/features'
import { appName } from '@/lib/shared'

export function SdkFeatures() {
  return (
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
  )
}
