import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/shared'

// Emitted as a static `robots.txt` under `output: 'export'`.
export const dynamic = 'force-static'

/**
 * robots directives. Note: GitHub Pages project sites serve under
 * `/<repo>/`, so crawlers reading `https://<user>.github.io/robots.txt` won't
 * see this file — submit the sitemap directly in Search Console, or move to a
 * custom domain (set `NEXT_PUBLIC_BASE_PATH=''`) where root robots.txt works.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
