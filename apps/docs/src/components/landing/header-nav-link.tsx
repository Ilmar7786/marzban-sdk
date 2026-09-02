'use client'

import { usePathname } from 'fumadocs-core/framework'
import Link from 'fumadocs-core/link'
import { isLinkItemActive } from 'fumadocs-ui/layouts/shared'
import type { ReactNode } from 'react'

/**
 * Icon + text nav link for the landing header. Fumadocs' own `main`-type nav
 * items only render the label on desktop (icons are mobile-menu only), so
 * this reimplements the same active-state logic via `isLinkItemActive` to
 * show icons at every breakpoint.
 */
export function HeaderNavLink({ href, icon, children }: { href: string; icon: ReactNode; children: string }) {
  const pathname = usePathname()
  const active = isLinkItemActive({ type: 'main', url: href, text: children }, pathname)

  return (
    <Link
      href={href}
      data-active={active}
      className="inline-flex items-center gap-1.5 p-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground data-[active=true]:text-fd-primary [&_svg]:size-4"
    >
      {icon}
      {children}
    </Link>
  )
}
