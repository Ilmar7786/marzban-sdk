'use client'

import { useI18n } from 'fumadocs-ui/contexts/i18n'
import { Globe } from 'lucide-react'

/**
 * Language switcher.
 *
 * Currently shows only English — the UI affordance is visible now so users
 * know more languages are planned. Extend by adding locales to
 * `src/lib/i18n.ts` and wiring up `onLocaleChange` once routing supports it.
 *
 * - `variant="header"` (default): label pill for the landing header nav.
 * - `variant="icon"`: globe-only icon button sized to sit inline with the
 *   other controls in the docs sidebar footer row.
 */
export function LanguageSwitcher({ variant = 'header' }: { variant?: 'header' | 'icon' }) {
  const { locale, locales } = useI18n()

  const current = locale ?? 'en'
  const label = locales?.find(l => l.locale === current)?.name ?? current.toUpperCase()
  const disabled = !locales || locales.length <= 1

  if (variant === 'icon') {
    return (
      <button
        className="inline-flex size-9 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground disabled:cursor-not-allowed"
        aria-label={`Language: ${label}`}
        disabled={disabled}
      >
        <Globe className="size-4.5" />
      </button>
    )
  }

  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      aria-label={`Language: ${label}`}
      disabled={disabled}
    >
      <Globe className="size-4" />
      <span className="hidden sm:inline">{current.toUpperCase()}</span>
    </button>
  )
}
