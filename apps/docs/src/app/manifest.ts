import type { MetadataRoute } from 'next'

import { appName, withBasePath } from '@/lib/shared'

// Emitted as a static file under `output: 'export'`.
export const dynamic = 'force-static'

// Web app manifest. Icon `src` is written as a raw string, so the deployment
// base path is applied explicitly (the router doesn't touch manifest entries).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appName} Documentation`,
    short_name: appName,
    description: 'The complete, fully typed TypeScript SDK for the Marzban API.',
    start_url: withBasePath('/'),
    display: 'standalone',
    background_color: '#0B0813',
    theme_color: '#7346F1',
    icons: [
      {
        src: withBasePath('/icon.svg'),
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  }
}
