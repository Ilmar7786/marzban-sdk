'use client'

import { useId } from 'react'

/**
 * Brand mark — the gradient chevron monogram, matching `src/app/icon.svg`
 * (favicon) and the apple-icon. Rendered inline in the header next to the
 * `appName` wordmark.
 *
 * The gradient id is generated per-instance with `useId()`: Fumadocs renders
 * the nav title in more than one place at once (e.g. a hidden mobile/collapsed
 * copy), so a hardcoded id would collide and `url(#id)` would resolve to the
 * first (often 0-sized, non-painting) copy — leaving the visible mark with no
 * fill. A unique id per render keeps every instance painted.
 */
export function BrandMark({ className }: { className?: string }) {
  const gradientId = useId()
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
      <path d="M15 46V20l17 18 17-18v26" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7346F1" />
          <stop offset="1" stopColor="#BF34B2" />
        </linearGradient>
      </defs>
    </svg>
  )
}
