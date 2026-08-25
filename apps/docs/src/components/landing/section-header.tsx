import type { ReactNode } from 'react'

import { Eyebrow } from '@/components/ui/eyebrow'

interface SectionHeaderProps {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
}

/** Centered eyebrow + heading + lead paragraph, shared by all landing sections. */
export function SectionHeader({ eyebrow, title, lead }: SectionHeaderProps) {
  return (
    <div className="text-center">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        className={eyebrow ? 'mt-4 text-2xl font-bold tracking-tight sm:text-3xl' : 'text-3xl font-bold tracking-tight'}
      >
        {title}
      </h2>
      {lead ? <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">{lead}</p> : null}
    </div>
  )
}
