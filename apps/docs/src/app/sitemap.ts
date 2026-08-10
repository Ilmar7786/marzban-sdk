import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/shared'
import { source } from '@/lib/source'

// Emitted as a static `sitemap.xml` under `output: 'export'`.
export const dynamic = 'force-static'

/**
 * XML sitemap for search engines. Emitted as a static `sitemap.xml` by the
 * export build. URLs are absolute and carry the trailing slash that
 * `trailingSlash: true` serves them at, so they match the canonical tags.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const home: MetadataRoute.Sitemap[number] = {
    url: `${siteUrl}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1,
  }

  const pages = source.getPages().map<MetadataRoute.Sitemap[number]>(page => ({
    url: `${siteUrl}${page.url}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    // The docs landing page outranks individual articles.
    priority: page.url === '/docs' ? 0.9 : 0.7,
  }))

  return [home, ...pages]
}
