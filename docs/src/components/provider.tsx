'use client'

import { RootProvider } from 'fumadocs-ui/provider/next'
import { type ReactNode } from 'react'

import SearchDialog from '@/components/search'
import { locales } from '@/lib/i18n'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      i18n={{
        locale: 'en',
        locales,
      }}
    >
      {children}
    </RootProvider>
  )
}
