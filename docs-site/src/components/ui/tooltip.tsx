import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * Lightweight CSS-only tooltip. Wraps a single interactive control and shows a
 * styled label on hover/focus — no JS or extra deps, so it survives the static
 * export. The label appears above the control by default.
 *
 * Use this instead of a bare `title` attribute (which renders slowly and
 * unstyled) for the sidebar/header icon controls.
 */
export function Tooltip({
  label,
  children,
  side = 'top',
  align = 'center',
  className,
}: {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
  /** Horizontal anchoring — use `start`/`end` for edge controls so the label isn't clipped. */
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  const alignClass =
    align === 'start'
      ? 'left-0 origin-bottom-left'
      : align === 'end'
        ? 'right-0 origin-bottom-right'
        : 'left-1/2 -translate-x-1/2 origin-bottom'

  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border bg-fd-popover px-2 py-1 text-xs font-medium text-fd-popover-foreground shadow-md',
          // Show on hover, or on keyboard focus only (`:focus-visible`) — a
          // mouse click leaves focus on the control but must not keep the
          // tooltip pinned open after the cursor leaves.
          'scale-95 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 group-has-[:focus-visible]:scale-100 group-has-[:focus-visible]:opacity-100',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          alignClass
        )}
      >
        {label}
      </span>
    </span>
  )
}
