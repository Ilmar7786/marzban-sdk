import { CodePreview } from '@/components/landing/code-preview'
import { SectionHeader } from '@/components/landing/section-header'
import { sdkSample } from '@/config/landing/code-samples'

export function SdkCode() {
  return (
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
  )
}
