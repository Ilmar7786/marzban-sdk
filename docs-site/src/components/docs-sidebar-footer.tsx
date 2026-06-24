import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch'
import { Package } from 'lucide-react'

import { gitConfig, npmPackage } from '@/lib/shared'

import { GithubMark } from './landing/header-github'
import { LanguageSwitcher } from './landing/language-switcher'

/** Ghost icon button matching Fumadocs' own sidebar control styling. */
const iconButton =
  'inline-flex size-9 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4.5'

/**
 * The docs sidebar footer rendered as a single compact control row: npm,
 * GitHub, the language switcher and the theme toggle, all inline inside one
 * `bg-fd-secondary/50` pill — the same treatment Fumadocs gives its default
 * footer. The layout disables the built-in footer controls so this is the only
 * row (see `src/app/docs/layout.tsx`).
 */
export function DocsSidebarFooter() {
  return (
    <div className="mt-2 flex items-center rounded-lg border bg-fd-secondary/50 p-0.5 text-fd-muted-foreground">
      <a
        href={`https://www.npmjs.com/package/${npmPackage}`}
        target="_blank"
        rel="noreferrer"
        aria-label="View on npm"
        className={iconButton}
      >
        <Package />
      </a>
      <a
        href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
        target="_blank"
        rel="noreferrer"
        aria-label="View on GitHub"
        className={iconButton}
      >
        <GithubMark />
      </a>
      <LanguageSwitcher variant="icon" />
      <ThemeSwitch className="ms-auto border-0 bg-transparent p-0 *:rounded-md" />
    </div>
  )
}
