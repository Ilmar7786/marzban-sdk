import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch'
import { BookOpen, Bot } from 'lucide-react'

import { HeaderGithub } from '@/components/landing/header-github'
import { BrandMark } from '@/components/ui/brand-mark'
import { PackagesPopover } from '@/components/ui/packages-popover'
import { Tooltip } from '@/components/ui/tooltip'

import { appName, docsRoute } from './shared'

/** Ghost icon button for the landing header nav, matching Fumadocs' own controls. */
const navIconButton =
  'inline-flex size-9 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4.5'

/**
 * Shared layout options for both the landing (HomeLayout) and docs (DocsLayout).
 *
 * The utility controls — the packages popover and the GitHub star pill — live in the nav `links`
 * so they render in the landing header. The docs layout renders these itself in
 * a single compact sidebar-footer row (see `DocsSidebarFooter`), so it opts out
 * here via `navExtras: false` to avoid duplicating them as stray chips in the
 * sidebar navigation list.
 */
export function baseOptions({ navExtras = true }: { navExtras?: boolean } = {}): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <BrandMark className="size-6" />
          {appName}
        </span>
      ),
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
              url: docsRoute,
              icon: <BookOpen />,
            },
            {
              type: 'main',
              text: 'MCP Server',
              url: `${docsRoute}/mcp-server/overview`,
              icon: <Bot />,
            },
          ] satisfies BaseLayoutProps['links'])
        : []),
      ...(navExtras
        ? ([
            {
              type: 'custom',
              secondary: true,
              children: (
                <Tooltip label="Packages" side="bottom">
                  <PackagesPopover triggerClassName={navIconButton} />
                </Tooltip>
              ),
            },
            {
              type: 'custom',
              secondary: true,
              children: (
                <Tooltip label="Star on GitHub" side="bottom" align="end">
                  <HeaderGithub />
                </Tooltip>
              ),
            },
          ] satisfies BaseLayoutProps['links'])
        : []),
    ],
  }
}
