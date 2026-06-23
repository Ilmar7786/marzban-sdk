'use client'

import { useI18n } from 'fumadocs-ui/contexts/i18n'
import { Globe } from 'lucide-react'

/**
 * Language switcher for the header nav.
 *
 * Currently shows only English — the UI affordance is visible now so users
 * know more languages are planned. Extend by adding locales to
 * `src/lib/i18n.ts` and wiring up `onLocaleChange` once routing supports it.
 */
export function LanguageSwitcher() {
  const { locale, locales } = useI18n()

  const current = locale ?? 'en'
  const label = locales?.find(l => l.locale === current)?.name ?? current.toUpperCase()

  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      aria-label={`Language: ${label}`}
      title="Language — more translations coming soon"
      disabled={!locales || locales.length <= 1}
    >
      <Globe className="size-4" />
      <span className="hidden sm:inline">{current.toUpperCase()}</span>
    </button>
  )
}
