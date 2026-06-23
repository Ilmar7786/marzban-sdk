import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BookOpen, Boxes, Package } from 'lucide-react'

import { HeaderGithub } from '@/components/landing/header-github'
import { LanguageSwitcher } from '@/components/landing/language-switcher'

import { appName, npmPackage } from './shared'

/** Compact brand mark echoing the Marzban crossed-bars logo. */

export function baseOptions(): BaseLayoutProps {
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
    ],
  }
}
