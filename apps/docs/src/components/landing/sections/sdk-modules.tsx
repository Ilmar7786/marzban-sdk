import { ModuleCard } from '@/components/landing/module-card'
import { SectionHeader } from '@/components/landing/section-header'
import { modules } from '@/config/landing/modules'

export function SdkModules() {
  return (
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
  )
}
