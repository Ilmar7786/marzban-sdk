import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { icons } from 'lucide-react'
import { createElement } from 'react'

import { docsContentRoute, docsImageRoute, docsRoute, withBasePath } from './shared'

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  // Resolve `icon` fields in meta.json / frontmatter to lucide-react icons.
  icon(icon) {
    if (icon && icon in icons) {
      return createElement(icons[icon as keyof typeof icons])
    }
  },
  plugins: [],
})

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png']

  return {
    segments,
    // Root-relative on purpose: this URL is consumed via Next metadata
    // (`openGraph.images`), which applies the deployment base path itself.
    url: `${docsImageRoute}/${segments.join('/')}`,
  }
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md']

  return {
    segments,
    // Fetched/linked as a raw string (not Next metadata, so no automatic
    // base-path injection), so build the full path explicitly.
    url: withBasePath(`${docsContentRoute}/${segments.join('/')}`),
  }
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed')

  return `# ${page.data.title} (${page.url})

${processed}`
}
