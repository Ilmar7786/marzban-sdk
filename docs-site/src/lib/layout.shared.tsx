import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch'
import { BookOpen, Package } from 'lucide-react'

import { HeaderGithub } from '@/components/landing/header-github'
import { LanguageSwitcher } from '@/components/landing/language-switcher'
import { Tooltip } from '@/components/ui/tooltip'

import { appName, npmPackage } from './shared'

/** Ghost icon button for the landing header nav, matching Fumadocs' own controls. */
const navIconButton =
  'inline-flex size-9 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4.5'

/**
 * Shared layout options for both the landing (HomeLayout) and docs (DocsLayout).
 *
 * The utility controls — npm, the GitHub star pill and the language switcher —
 * live in the nav `links` so they render in the landing header. The docs
 * layout renders these itself in a single compact sidebar-footer row (see
 * `DocsSidebarFooter`), so it opts out here via `navExtras: false` to avoid
 * duplicating them as stray chips in the sidebar navigation list.
 */
export function baseOptions({ navExtras = true }: { navExtras?: boolean } = {}): BaseLayoutProps {
  return {
    nav: {
      title: <span className="inline-flex items-center gap-2 font-semibold">{appName}</span>,
    },
    // Wrap the landing header theme toggle in a tooltip. The docs layout
    // overrides this with `{ enabled: false }` (its theme toggle lives in the
    // DocsSidebarFooter row, already tooltip-wrapped there).
    themeSwitch: {
      component: (
        <Tooltip label="Toggle theme" side="bottom">
          <ThemeSwitch />
        </Tooltip>
      ),
    },
    links: [
      ...(navExtras
        ? ([
            {
              type: 'main',
              text: 'Docs',
              url: '/docs',
              icon: <BookOpen />,
            },
          ] satisfies BaseLayoutProps['links'])
        : []),
      ...(navExtras
        ? ([
            {
              type: 'custom',
              secondary: true,
              children: (
                <Tooltip label="View on npm" side="bottom">
                  <a
                    href={`https://www.npmjs.com/package/${npmPackage}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View on npm"
                    className={navIconButton}
                  >
                    <Package />
                  </a>
                </Tooltip>
              ),
            },
            {
              type: 'custom',
              secondary: true,
              children: (
                <Tooltip label="Star on GitHub" side="bottom">
                  <HeaderGithub />
                </Tooltip>
              ),
            },
            {
              type: 'custom',
              secondary: true,
              children: (
                <Tooltip label="More translations coming soon" side="bottom" align="end">
                  <LanguageSwitcher />
                </Tooltip>
              ),
            },
          ] satisfies BaseLayoutProps['links'])
        : []),
    ],
  }
}
