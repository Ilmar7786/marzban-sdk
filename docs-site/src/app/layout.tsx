import './global.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Provider } from '@/components/provider'
import { appName } from '@/lib/shared'

const inter = Inter({
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ilmar7786.github.io/marzban-sdk'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} — Fully typed Marzban API client`,
    template: `%s · ${appName}`,
  },
  description: 'A fully typed, auto-generated client SDK for the Marzban API — for Node.js and the browser.',
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
