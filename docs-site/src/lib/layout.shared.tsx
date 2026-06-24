import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BookOpen, Boxes, Package } from 'lucide-react'

import { HeaderGithub } from '@/components/landing/header-github'
import { LanguageSwitcher } from '@/components/landing/language-switcher'

import { appName, npmPackage } from './shared'

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
    links: [
      {
        type: 'main',
        text: 'Documentation',
        url: '/docs',
        icon: <BookOpen />,
      },
      {
        type: 'main',
        text: 'API Reference',
        url: '/docs/api-reference',
        icon: <Boxes />,
      },
      ...(navExtras
        ? ([
            {
              type: 'icon',
              text: 'npm',
              label: 'View on npm',
              url: `https://www.npmjs.com/package/${npmPackage}`,
              external: true,
              icon: <Package />,
            },
            {
              type: 'custom',
              secondary: true,
              children: <HeaderGithub />,
            },
            {
              type: 'custom',
              secondary: true,
              children: <LanguageSwitcher />,
            },
          ] satisfies BaseLayoutProps['links'])
        : []),
    ],
  }
}
