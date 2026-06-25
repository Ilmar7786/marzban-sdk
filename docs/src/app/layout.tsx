import './global.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Provider } from '@/components/provider'
import { appName, gitConfig, npmPackage, siteUrl } from '@/lib/shared'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} — The complete TypeScript SDK for Marzban`,
    template: `%s · ${appName}`,
  },
  description:
    'The complete, fully typed TypeScript SDK for Marzban — auth, retries, WebSocket streaming, webhooks and validation. Node.js, Bun, Deno, and the browser.',
  applicationName: appName,
  authors: [{ name: gitConfig.user, url: `https://github.com/${gitConfig.user}` }],
  creator: gitConfig.user,
  publisher: gitConfig.user,
  keywords: [
    'Marzban',
    'Marzban API',
    'Marzban SDK',
    'TypeScript SDK',
    'Marzban client',
    'VPN panel API',
    'Xray',
    npmPackage,
    'Node.js',
    'webhooks',
    'WebSocket',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: appName,
    url: '/',
    locale: 'en_US',
    title: `${appName} — The complete TypeScript SDK for Marzban`,
    description:
      'The complete, fully typed TypeScript SDK for Marzban — auth, retries, WebSocket streaming, webhooks and validation. Node.js, Bun, Deno, and the browser.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${appName} — The complete TypeScript SDK for Marzban`,
    description: 'The complete, fully typed TypeScript SDK for Marzban — far more than an API client.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
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
