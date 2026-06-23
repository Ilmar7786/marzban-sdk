'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { npmPackage } from '@/lib/shared'

interface Entry {
  label: string
  cmd: string
  hint?: string
}

const managers: Entry[] = [
  { label: 'npm', cmd: `npm install ${npmPackage}` },
  { label: 'yarn', cmd: `yarn add ${npmPackage}` },
  { label: 'pnpm', cmd: `pnpm add ${npmPackage}` },
  { label: 'bun', cmd: `bun add ${npmPackage}` },
  { label: 'deno', cmd: `deno add npm:${npmPackage}` },
  {
    label: 'CDN',
    cmd: `import { createMarzbanSDK } from 'https://esm.sh/${npmPackage}'`,
    hint: 'No build step — import straight from esm.sh in the browser or Deno.',
  },
]

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        })
      }}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-fd-border bg-fd-background text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
    </button>
  )
}

export function InstallSection() {
  const [active, setActive] = useState(managers[0].label)
  const current = managers.find(m => m.label === active) ?? managers[0]

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Tab row */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-fd-border bg-fd-card p-1">
        {managers.map(m => (
          <button
            key={m.label}
            type="button"
            onClick={() => setActive(m.label)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active === m.label
                ? 'cta-primary'
                : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Command line */}
      <div className="code-frame mt-3 !rounded-xl text-left">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="select-none font-mono text-sm text-fd-primary">$</span>
          <code className="flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">{current.cmd}</code>
          <CopyButton value={current.cmd} />
        </div>
      </div>

      {current.hint && <p className="mt-3 text-sm text-fd-muted-foreground">{current.hint}</p>}
    </div>
  )
}
