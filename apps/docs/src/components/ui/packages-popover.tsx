'use client'

import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover'
import { ArrowUpRight, Container, Package } from 'lucide-react'

import { mcpDockerImage, mcpNpmPackage, npmPackage } from '@/lib/shared'

const links = [
  { icon: Package, label: 'marzban-sdk', sub: 'npm', href: `https://www.npmjs.com/package/${npmPackage}` },
  { icon: Package, label: 'marzban-mcp', sub: 'npm', href: `https://www.npmjs.com/package/${mcpNpmPackage}` },
  { icon: Container, label: mcpDockerImage, sub: 'Docker Hub', href: `https://hub.docker.com/r/${mcpDockerImage}` },
]

/**
 * Popover listing every published package/image in the repo. Replaces what
 * used to be a single icon hard-linked to `marzban-sdk` on npm — misleading
 * once `marzban-mcp` (npm + Docker) shipped alongside it.
 */
export function PackagesPopover({ triggerClassName }: { triggerClassName: string }) {
  return (
    <Popover>
      <PopoverTrigger className={triggerClassName} aria-label="Packages">
        <Package />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        {links.map(({ icon: Icon, label, sub, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <Icon className="size-4 shrink-0 text-fd-muted-foreground" />
            <span className="flex-1">
              <span className="block font-medium text-fd-foreground">{label}</span>
              <span className="block text-xs text-fd-muted-foreground">{sub}</span>
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-fd-muted-foreground" />
          </a>
        ))}
      </PopoverContent>
    </Popover>
  )
}
